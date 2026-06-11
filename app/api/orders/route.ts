import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { calculateTip } from "@/lib/order-calculations";
import {
  calculateServerDeliveryFee,
  calculateServerLateFee,
  validateServerRequestedDate,
} from "@/lib/server-business-rules";
import { sendAppEmail, appUrl } from "@/lib/email";
import { OrderConfirmationEmail } from "@/emails/OrderConfirmationEmail";
import type { CartItem } from "@/store/cart-store";
import type { CheckoutDetails } from "@/types/order";
import type { DecimalLike } from "@/types/display";

type CreateOrderRequest = {
  items?: CartItem[];
  checkout?: CheckoutDetails;
};

type CreatedOrderItem = {
  name: string;
  quantity: number;
  unitPrice: DecimalLike;
  lineTotal: DecimalLike;
  notes: string | null;
};

type ServerMenuItem = {
  id: string;
  name: string;
  price: DecimalLike;
  type: string;
  available: boolean;
  archived: boolean;
  requiresApproval: boolean;
  customerInstructionsEnabled: boolean;
  optionGroups: {
    name: string;
    required: boolean;
    multiple: boolean;
    choices: {
      name: string;
      priceDelta: DecimalLike;
      requestOnly: boolean;
    }[];
  }[];
};

type ValidatedOrderItem = {
  menuItemId: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  requiresApproval: boolean;
  notes: string | null;
};

type ServerRecoveredOrderItem = {
  id: string;
  menuItemId: string | null;
  name: string;
  unitPrice: DecimalLike;
  notes: string | null;
  menuItem: {
    type: string;
    available: boolean;
    archived: boolean;
    requiresApproval: boolean;
  } | null;
};

function normalizeSubmittedChoiceName(choiceName: string) {
  return choiceName.replace(/\s+\(Request Only\)$/i, "").trim();
}

const allowedTipTypes = new Set(["none", "10", "15", "20", "custom"]);
const allowedPaymentMethods = new Set(["manual", "cash"]);

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { items, checkout } = (await request.json()) as CreateOrderRequest;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Order must include at least one item." },
        { status: 400 },
      );
    }

    if (!checkout) {
      return NextResponse.json(
        { error: "Checkout details are required." },
        { status: 400 },
      );
    }

    const allowedOrderTypes = ["delivery", "pickup"];

    if (!allowedOrderTypes.includes(checkout.orderType)) {
      return NextResponse.json(
        { error: "Invalid order type." },
        { status: 400 },
      );
    }

    const contact = {
      name: String(checkout.name ?? "").trim(),
      phone: String(checkout.phone ?? "").trim(),
      addressLine1: String(checkout.addressLine1 ?? "").trim(),
      addressLine2: String(checkout.addressLine2 ?? "").trim(),
      city: String(checkout.city ?? "").trim(),
      state: String(checkout.state ?? "").trim(),
      postalCode: String(checkout.postalCode ?? "").trim(),
      deliveryNotes: String(checkout.deliveryNotes ?? "").trim(),
    };

    if (!checkout.requestedDateTime) {
      return NextResponse.json(
        { error: "Please choose a requested date and time." },
        { status: 400 },
      );
    }

    const requestedDate = new Date(checkout.requestedDateTime);

    if (Number.isNaN(requestedDate.getTime())) {
      return NextResponse.json(
        { error: "Please choose a valid requested date and time." },
        { status: 400 },
      );
    }

    const requestedDateValidation =
      await validateServerRequestedDate(requestedDate);

    if (!requestedDateValidation.valid) {
      return NextResponse.json(
        { error: requestedDateValidation.error },
        { status: 400 },
      );
    }

    if (checkout.orderType === "delivery") {
      if (
        !contact.name ||
        !contact.phone ||
        !contact.addressLine1 ||
        !contact.city ||
        !contact.state ||
        !contact.postalCode
      ) {
        return NextResponse.json(
          {
            error:
              "Delivery orders require name, phone number, address, city, state, and postal code.",
          },
          { status: 400 },
        );
      }
    }

    if (checkout.orderType === "pickup" && (!contact.name || !contact.phone)) {
      return NextResponse.json(
        { error: "Pickup orders require your name and phone number." },
        { status: 400 },
      );
    }

    if (!allowedTipTypes.has(checkout.tipType)) {
      return NextResponse.json(
        { error: "Invalid tip selection." },
        { status: 400 },
      );
    }

    const customTipAmount =
      checkout.tipType === "custom" ? Number(checkout.customTipAmount ?? 0) : 0;

    if (!Number.isFinite(customTipAmount) || customTipAmount < 0) {
      return NextResponse.json(
        { error: "Custom tip amount must be zero or greater." },
        { status: 400 },
      );
    }

    if (!allowedPaymentMethods.has(checkout.paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid or unavailable payment method." },
        { status: 400 },
      );
    }

    let payByDate: Date | null = null;

    if (checkout.paymentMethod === "manual") {
      if (!checkout.payByDate) {
        return NextResponse.json(
          { error: "Manual payment orders require a pay-by date." },
          { status: 400 },
        );
      }

      payByDate = new Date(checkout.payByDate);

      if (Number.isNaN(payByDate.getTime())) {
        return NextResponse.json(
          { error: "Manual payment orders require a valid pay-by date." },
          { status: 400 },
        );
      }
    }

    const liveMenuItemIds = Array.from(
      new Set(
        items
          .filter((item) => item.category !== "Reorder")
          .map((item) => item.menuItemId)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const liveMenuItems = (await prisma.menuItem.findMany({
      where: {
        id: {
          in: liveMenuItemIds,
        },
      },
      select: {
        id: true,
        name: true,
        price: true,
        type: true,
        available: true,
        archived: true,
        requiresApproval: true,
        customerInstructionsEnabled: true,
        optionGroups: {
          select: {
            name: true,
            required: true,
            multiple: true,
            choices: {
              select: {
                name: true,
                priceDelta: true,
                requestOnly: true,
              },
            },
          },
        },
      },
    })) as ServerMenuItem[];

    const liveMenuItemById = new Map(
      liveMenuItems.map((item) => [item.id, item]),
    );

    const recoveredOrderItemIds = Array.from(
      new Set(
        items
          .filter((item) => item.category === "Reorder")
          .map((item) => item.recoveredOrderItemId)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const recoveredOrderItems = (await prisma.orderItem.findMany({
      where: {
        id: {
          in: recoveredOrderItemIds,
        },
        order: {
          customerEmail: session.user.email,
        },
      },
      select: {
        id: true,
        menuItemId: true,
        name: true,
        unitPrice: true,
        notes: true,
        menuItem: {
          select: {
            type: true,
            available: true,
            archived: true,
            requiresApproval: true,
          },
        },
      },
    })) as ServerRecoveredOrderItem[];

    const recoveredOrderItemById = new Map(
      recoveredOrderItems.map((item) => [item.id, item]),
    );

    const validatedItems: ValidatedOrderItem[] = [];

    for (const item of items) {
      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity < 1) {
        return NextResponse.json(
          { error: "Order item quantities must be whole numbers greater than zero." },
          { status: 400 },
        );
      }

      if (item.category === "Reorder") {
        if (!item.recoveredOrderItemId) {
          return NextResponse.json(
            { error: "Reorder items must include a valid previous order item." },
            { status: 400 },
          );
        }

        const recoveredItem = recoveredOrderItemById.get(
          item.recoveredOrderItemId,
        );

        if (!recoveredItem) {
          return NextResponse.json(
            { error: "One or more reorder items could not be verified." },
            { status: 400 },
          );
        }

        const unitPrice = Number(recoveredItem.unitPrice);
        const name = recoveredItem.name.trim();

        if (!name || !Number.isFinite(unitPrice) || unitPrice < 0) {
          return NextResponse.json(
            { error: "Reorder items must include a valid saved name and price." },
            { status: 400 },
          );
        }

        if (recoveredItem.menuItem?.type === "CATERING") {
          return NextResponse.json(
            { error: "Catering items must be submitted as service requests." },
            { status: 400 },
          );
        }

        if (
          recoveredItem.menuItem &&
          (!recoveredItem.menuItem.available || recoveredItem.menuItem.archived)
        ) {
          return NextResponse.json(
            { error: `${name} is no longer available for reorder.` },
            { status: 400 },
          );
        }

        validatedItems.push({
          menuItemId: recoveredItem.menuItemId,
          name,
          quantity,
          unitPrice,
          lineTotal: unitPrice * quantity,
          requiresApproval:
            Boolean(recoveredItem.menuItem?.requiresApproval) ||
            (recoveredItem.notes?.includes("(Request Only)") ?? false),
          notes:
            [
              recoveredItem.notes,
              item.customerInstructions
                ? `Special Instructions: ${item.customerInstructions}`
                : null,
            ]
              .filter(Boolean)
              .join("\n") || null,
        });

        continue;
      }

      if (!item.menuItemId) {
        return NextResponse.json(
          { error: "Cart items must include a valid menu item." },
          { status: 400 },
        );
      }

      const menuItem = liveMenuItemById.get(item.menuItemId);

      if (!menuItem) {
        return NextResponse.json(
          { error: "One or more cart items are no longer available." },
          { status: 400 },
        );
      }

      if (menuItem.type === "CATERING") {
        return NextResponse.json(
          { error: "Catering items must be submitted as service requests." },
          { status: 400 },
        );
      }

      if (!menuItem.available || menuItem.archived) {
        return NextResponse.json(
          { error: `${menuItem.name} is no longer available.` },
          { status: 400 },
        );
      }

      const selectedOptions = item.selectedOptions ?? [];
      const selectedByGroup = new Map<string, string[]>();
      const seenSelections = new Set<string>();
      let unitPrice = Number(menuItem.price);
      let itemRequiresApproval = menuItem.requiresApproval;
      const optionNotes: string[] = [];

      for (const option of selectedOptions) {
        const groupName = String(option.groupName ?? "").trim();
        const choiceName = normalizeSubmittedChoiceName(
          String(option.choiceName ?? ""),
        );

        const group = menuItem.optionGroups.find(
          (entry) => entry.name === groupName,
        );

        const choice = group?.choices.find(
          (entry) => entry.name === choiceName,
        );

        if (!group || !choice) {
          return NextResponse.json(
            { error: "One or more selected options are no longer available." },
            { status: 400 },
          );
        }

        const selectionKey = `${group.name}:${choice.name}`;

        if (seenSelections.has(selectionKey)) {
          return NextResponse.json(
            { error: "Duplicate option selections are not allowed." },
            { status: 400 },
          );
        }

        seenSelections.add(selectionKey);
        selectedByGroup.set(group.name, [
          ...(selectedByGroup.get(group.name) ?? []),
          choice.name,
        ]);

        const priceDelta = Number(choice.priceDelta);

        unitPrice += priceDelta;
        itemRequiresApproval = itemRequiresApproval || choice.requestOnly;
        optionNotes.push(
          `${group.name}: ${
            choice.requestOnly ? `${choice.name} (Request Only)` : choice.name
          }${priceDelta > 0 ? ` (+$${priceDelta.toFixed(2)})` : ""}`,
        );
      }

      for (const group of menuItem.optionGroups) {
        const selectedChoices = selectedByGroup.get(group.name) ?? [];

        if (group.required && selectedChoices.length === 0) {
          return NextResponse.json(
            { error: `Please select an option for ${group.name}.` },
            { status: 400 },
          );
        }

        if (!group.multiple && selectedChoices.length > 1) {
          return NextResponse.json(
            { error: `${group.name} allows only one selection.` },
            { status: 400 },
          );
        }
      }

      if (Math.abs(Number(item.price) - unitPrice) > 0.01) {
        return NextResponse.json(
          {
            error:
              "Your cart prices have changed. Please refresh your cart and try again.",
          },
          { status: 400 },
        );
      }

      validatedItems.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity,
        unitPrice,
        lineTotal: unitPrice * quantity,
        requiresApproval: itemRequiresApproval,
        notes:
          [
            ...optionNotes,
            menuItem.customerInstructionsEnabled && item.customerInstructions
              ? `Special Instructions: ${item.customerInstructions}`
              : null,
          ]
            .filter(Boolean)
            .join("\n") || null,
      });
    }
const userAllergens = await prisma.userAllergen.findMany({
  where: {
    user: {
      email: session.user.email,
    },
  },
  select: {
    allergenId: true,
  },
});

const userAllergenIds = new Set(
  userAllergens.map((entry) => entry.allergenId),
);

const submittedMenuItemIds = validatedItems
  .map((item) => item.menuItemId)
  .filter((id): id is string => Boolean(id));

const submittedMenuItemAllergens =
  submittedMenuItemIds.length > 0
    ? await prisma.menuItemAllergen.findMany({
        where: {
          menuItemId: {
            in: submittedMenuItemIds,
          },
        },
        select: {
          allergenId: true,
        },
      })
    : [];

const hasAllergenConflict = submittedMenuItemAllergens.some((entry) =>
  userAllergenIds.has(entry.allergenId),
);

if (hasAllergenConflict && !checkout.allergenAcknowledged) {
  return NextResponse.json(
    {
      error:
        "Please acknowledge the allergen warning before submitting your order.",
    },
    { status: 400 },
  );
}
    const subtotal = validatedItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0,
    );

    const deliveryFee = await calculateServerDeliveryFee(checkout.orderType);
    const lateFee = await calculateServerLateFee();

    const tipAmount = calculateTip(
      subtotal,
      checkout.tipType,
      customTipAmount,
    );

    const total = subtotal + deliveryFee + lateFee + tipAmount;
    const requiresApproval = validatedItems.some(
      (item) => item.requiresApproval,
    );

    const order = await prisma.order.create({
      data: {
        user: {
          connect: {
            email: session.user.email,
          },
        },

        customerName: contact.name || session.user.name || "Customer",
        customerEmail: session.user.email,
        customerPhone: contact.phone || null,

        orderType:
          checkout.orderType === "delivery"
            ? "DELIVERY"
            : "PICKUP",

        status: requiresApproval ? "PENDING" : "ACCEPTED",
        approvalStatus: requiresApproval ? "PENDING" : "APPROVED",
        approvedAt: requiresApproval ? null : new Date(),

        requestedDateTime: requestedDate,

        allergyNotes: checkout.allergyNotes,
        substitutionPreference: checkout.substitutionPreference,

        allergenAcknowledged: hasAllergenConflict
          ? Boolean(checkout.allergenAcknowledged)
          : false,
        allergenAcknowledgedAt:
          hasAllergenConflict && checkout.allergenAcknowledged ? new Date() : null,

        subtotal,
        deliveryFee,
        lateFee,
        tipAmount,
        total,

        deliveryName: contact.name || session.user.name || null,
        deliveryPhone: contact.phone || null,
        deliveryAddressLine1: contact.addressLine1 || null,
        deliveryAddressLine2: contact.addressLine2 || null,
        deliveryCity: contact.city || null,
        deliveryState: contact.state || null,
        deliveryPostalCode: contact.postalCode || null,
        deliveryNotes: contact.deliveryNotes || null,

        payByDate,
        paymentProvider: checkout.paymentMethod,
        paymentStatus:
          checkout.paymentMethod === "cash"
            ? "OFFLINE_PAYMENT_DUE"
            : "PAY_BY_DATE",

        items: {
          create: validatedItems.map((item) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            notes: item.notes,
          })),
        },

        statusHistory: {
          create: {
            status: requiresApproval ? "PENDING" : "ACCEPTED",
            note: requiresApproval
              ? "Order created and waiting for approval."
              : "Order created and auto-approved.",
          },
        },
      },

      include: {
        items: true,
      },
    });

    try {
      if (checkout.saveContactInfo) {
        await prisma.user.update({
          where: {
            email: session.user.email,
          },
          data: {
            name: contact.name || session.user.name || null,
            phone: contact.phone || null,
            addressLine1: contact.addressLine1 || null,
            addressLine2: contact.addressLine2 || null,
            city: contact.city || null,
            state: contact.state || null,
            postalCode: contact.postalCode || null,
            deliveryNotes: contact.deliveryNotes || null,
          },
        });
      }
    } catch (profileError) {
      console.error("Failed to save checkout contact info to profile", profileError);
    }

    await sendAppEmail({
      to: session.user.email,
      subject: "Order Confirmation",
      react: OrderConfirmationEmail({
        customerName: order.customerName,
        orderId: order.id,
        orderType: order.orderType,
        total: Number(order.total),
        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.deliveryFee),
        lateFee: Number(order.lateFee),
        tipAmount: Number(order.tipAmount),
        paymentStatus: order.paymentStatus,
        approvalStatus: order.approvalStatus,
        orderUrl: `${appUrl}/orders/${order.id}`,

        deliveryName: order.deliveryName,
        deliveryPhone: order.deliveryPhone,
        deliveryAddressLine1: order.deliveryAddressLine1,
        deliveryAddressLine2: order.deliveryAddressLine2,
        deliveryCity: order.deliveryCity,
        deliveryState: order.deliveryState,
        deliveryPostalCode: order.deliveryPostalCode,
        deliveryNotes: order.deliveryNotes,
        allergenAcknowledged: order.allergenAcknowledged,
        allergenAcknowledgedAt: order.allergenAcknowledgedAt,

        items: order.items.map((item: CreatedOrderItem) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          lineTotal: Number(item.lineTotal),
          notes: item.notes,
        })),
      }),
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to create order." },
      { status: 500 },
    );
  }
}
