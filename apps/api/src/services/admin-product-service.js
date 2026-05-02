import { validateAdminProductInput } from "../../../../packages/shared/schemas/admin-product-schema.js";
import {
  createProductWithOptions,
  getAdminProductById,
  getAdminProducts,
  getProductOptions,
  updateProductWithOptions
} from "../db/d1-client.js";

function groupDatabaseOptions(options) {
  return options.reduce(
    (accumulator, option) => {
      if (option.option_group === "flavor") {
        accumulator.flavors.push(option.option_label);
      }

      if (option.option_group === "size") {
        accumulator.sizes.push({
          label: option.option_label,
          servings: option.servings,
          price: option.price
        });
      }

      if (option.option_group === "addon") {
        accumulator.addOns.push(option.option_label);
      }

      return accumulator;
    },
    { flavors: [], sizes: [], addOns: [] }
  );
}

function mapAdminProduct(product, options) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    shortDescription: product.short_description,
    startingPrice: product.starting_price,
    badge: product.badge,
    leadTimeHours: product.lead_time_hours,
    availabilityStatus: product.availability_status,
    featured: Boolean(product.featured),
    imageUrl: product.image_url,
    videoUrl: product.video_url,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
    options: groupDatabaseOptions(options)
  };
}

function normalizeInput(input) {
  return {
    slug: input.slug.trim(),
    name: input.name.trim(),
    category: input.category.trim(),
    shortDescription: input.shortDescription.trim(),
    startingPrice: input.startingPrice,
    badge: input.badge?.trim() || null,
    leadTimeHours: input.leadTimeHours,
    availabilityStatus: input.availabilityStatus,
    featured: Boolean(input.featured),
    imageUrl: input.imageUrl?.trim() || null,
    videoUrl: input.videoUrl?.trim() || null,
    flavors: input.flavors.map((value) => value.trim()),
    sizes: input.sizes.map((size) => ({
      label: size.label.trim(),
      servings: size.servings.trim(),
      price: size.price
    })),
    addOns: input.addOns.map((value) => value.trim())
  };
}

export async function getAdminProductsView(env) {
  const products = await getAdminProducts(env);

  return Promise.all(
    products.map(async (product) => {
      const options = await getProductOptions(env, product.id);
      return mapAdminProduct(product, options);
    })
  );
}

export async function getAdminProductDetail(env, productId) {
  const product = await getAdminProductById(env, productId);

  if (!product) {
    return null;
  }

  const options = await getProductOptions(env, product.id);
  return mapAdminProduct(product, options);
}

export async function createAdminProduct(env, input) {
  const validation = validateAdminProductInput(input);

  if (!validation.valid) {
    return {
      ok: false,
      status: 400,
      error: "Validation failed",
      details: validation.errors
    };
  }

  try {
    const createdProduct = await createProductWithOptions(env, normalizeInput(input));
    const options = await getProductOptions(env, createdProduct.id);

    return {
      ok: true,
      product: mapAdminProduct(createdProduct, options)
    };
  } catch (error) {
    return {
      ok: false,
      status: 409,
      error: "Unable to create product",
      details: [error.message]
    };
  }
}

export async function updateAdminProduct(env, productId, input) {
  const validation = validateAdminProductInput(input);

  if (!validation.valid) {
    return {
      ok: false,
      status: 400,
      error: "Validation failed",
      details: validation.errors
    };
  }

  try {
    const updatedProduct = await updateProductWithOptions(env, productId, normalizeInput(input));

    if (!updatedProduct) {
      return {
        ok: false,
        status: 404,
        error: "Product not found"
      };
    }

    const options = await getProductOptions(env, updatedProduct.id);

    return {
      ok: true,
      product: mapAdminProduct(updatedProduct, options)
    };
  } catch (error) {
    return {
      ok: false,
      status: 409,
      error: "Unable to update product",
      details: [error.message]
    };
  }
}
