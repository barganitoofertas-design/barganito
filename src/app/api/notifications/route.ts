import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const configs = await (prisma as any).notificationConfig.findMany({
      where: { userId: session.user.id },
      include: { category: true }
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
    const { categoryId, productNamePattern, targetPrice, targetDiscount } = await req.json();
    
    // Safety check: Ensure the user actually exists in the DB (stale session prevention)
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!userExists) {
      console.error('CRITICAL: Session userId not found in database:', session.user.id);
      return NextResponse.json({ error: "Sessão expirada ou usuário não encontrado. Por favor, saia e entre novamente." }, { status: 401 });
    }

    const config = await (prisma as any).notificationConfig.create({
      data: {
        userId: session.user.id,
        categoryId: categoryId || null,
        productNamePattern: productNamePattern || null,
        targetPrice: targetPrice ? parseFloat(targetPrice) : null,
        targetDiscount: targetDiscount ? parseFloat(targetDiscount) : null,
      },
      include: { category: true }
    });

    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    console.error('Create error:', error);
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
