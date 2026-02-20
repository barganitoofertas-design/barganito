import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const offset = (page - 1) * limit;

  try {
    const comments = await prisma.$queryRawUnsafe<any[]>(
      `SELECT c.*, u.name as "userName", p."name" as "productName",
       pr."discountPercentage", pr."description" as "promotionDescription",
       COALESCE(likes.count, 0) as likes,
       COALESCE(dislikes.count, 0) as dislikes
       FROM "Comment" c
       JOIN "User" u ON c."userId" = u.id
       JOIN "Promotion" pr ON c."promotionId" = pr.id
       JOIN "Product" p ON pr."productId" = p.id
       LEFT JOIN (SELECT "commentId", COUNT(*) as count FROM "CommentVote" WHERE "type" = 'like' GROUP BY "commentId") likes ON c.id = likes."commentId"
       LEFT JOIN (SELECT "commentId", COUNT(*) as count FROM "CommentVote" WHERE "type" = 'dislike' GROUP BY "commentId") dislikes ON c.id = dislikes."commentId"
       WHERE COALESCE(dislikes.count, 0) > COALESCE(likes.count, 0)
       ORDER BY (COALESCE(dislikes.count, 0) - COALESCE(likes.count, 0)) DESC
       LIMIT $1 OFFSET $2`,
      limit,
      offset,
    );

    const totalCount = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*) as total
       FROM "Comment" c
       LEFT JOIN (SELECT "commentId", COUNT(*) as count FROM "CommentVote" WHERE "type" = 'like' GROUP BY "commentId") likes ON c.id = likes."commentId"
       LEFT JOIN (SELECT "commentId", COUNT(*) as count FROM "CommentVote" WHERE "type" = 'dislike' GROUP BY "commentId") dislikes ON c.id = dislikes."commentId"
       WHERE COALESCE(dislikes.count, 0) > COALESCE(likes.count, 0)`,
    );

    const total = Number(totalCount[0].total);

    const formattedComments = comments.map((c) => ({
      id: c.id,
      text: c.text,
      createdAt: c.createdAt,
      user: { name: c.userName },
      promotion: {
        product: { name: c.productName },
        discountPercentage: c.discountPercentage,
        description: c.promotionDescription,
      },
      likes: Number(c.likes),
      dislikes: Number(c.dislikes),
    }));

    return NextResponse.json({
      comments: formattedComments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching disliked comments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
