import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const configs = await prisma.notificationConfig.findMany({
      where: { userId: session.user.id },
    });
    return NextResponse.json(configs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch configs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { category, productNamePattern, targetPrice, targetDiscount } = await req.json();

    const config = await prisma.notificationConfig.create({
      data: {
        userId: session.user.id,
        category,
        productNamePattern,
        targetPrice: targetPrice ? parseFloat(targetPrice) : null,
        targetDiscount: targetDiscount ? parseFloat(targetDiscount) : null,
      },
    });

    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create config" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  try {
    await prisma.notificationConfig.delete({
      where: { id, userId: session.user.id },
    });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
