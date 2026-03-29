import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import type { Product } from "@prisma/client";

export async function list(params: {
  page: number;
  limit: number;
  isActive?: boolean;
}): Promise<{ products: Product[]; total: number }> {
  const { page, limit, isActive } = params;
  const skip = (page - 1) * limit;
  const where = isActive !== undefined ? { isActive } : {};

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total };
}

export async function findById(id: string): Promise<Product> {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError("Product not found", 404);
  return product;
}

export async function create(data: {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  stock?: number;
  isActive?: boolean;
}): Promise<Product> {
  return prisma.product.create({
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      imageUrl: data.imageUrl || null,
      stock: data.stock ?? 0,
      isActive: data.isActive ?? true,
    },
  });
}

export async function update(
  id: string,
  data: {
    name?: string;
    description?: string;
    price?: number;
    imageUrl?: string;
    stock?: number;
    isActive?: boolean;
  },
): Promise<Product> {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new AppError("Product not found", 404);

  return prisma.product.update({
    where: { id },
    data: {
      ...data,
      imageUrl: data.imageUrl !== undefined ? data.imageUrl || null : undefined,
    },
  });
}

export async function remove(id: string): Promise<void> {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new AppError("Product not found", 404);
  await prisma.product.delete({ where: { id } });
}
