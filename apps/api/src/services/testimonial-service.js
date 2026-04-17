import { seedCatalog } from "../../../../packages/shared/constants/seed-catalog.js";
import { validateAdminTestimonialsInput } from "../../../../packages/shared/schemas/admin-testimonial-schema.js";
import { getAdminTestimonials, getPublicTestimonials, replaceTestimonials } from "../db/d1-client.js";

function mapPublicTestimonial(testimonial) {
  return {
    id: testimonial.id,
    customerName: testimonial.customer_name,
    occasionLabel: testimonial.occasion_label,
    quoteText: testimonial.quote_text,
    rating: testimonial.rating
  };
}

function mapAdminTestimonial(testimonial) {
  return {
    id: testimonial.id,
    customerName: testimonial.customer_name,
    occasionLabel: testimonial.occasion_label,
    quoteText: testimonial.quote_text,
    rating: testimonial.rating,
    isPublished: Boolean(testimonial.is_published),
    sortOrder: testimonial.sort_order,
    createdAt: testimonial.created_at,
    updatedAt: testimonial.updated_at
  };
}

function mapSeedTestimonial(testimonial, index) {
  return {
    id: null,
    customerName: testimonial.customerName,
    occasionLabel: testimonial.occasionLabel,
    quoteText: testimonial.quoteText,
    rating: testimonial.rating || 5,
    isPublished: testimonial.isPublished !== false,
    sortOrder: index + 1,
    createdAt: null,
    updatedAt: null
  };
}

function normalizeInput(testimonials) {
  return testimonials.map((testimonial) => ({
    customerName: testimonial.customerName.trim(),
    occasionLabel: testimonial.occasionLabel?.trim() || null,
    quoteText: testimonial.quoteText.trim(),
    rating: testimonial.rating || 5,
    isPublished: testimonial.isPublished !== false
  }));
}

export async function getPublicTestimonialsView(env) {
  const testimonials = await getPublicTestimonials(env);

  if (!testimonials.length && !env?.DB) {
    return seedCatalog.testimonials
      .filter((testimonial) => testimonial.isPublished !== false)
      .map((testimonial, index) => mapSeedTestimonial(testimonial, index));
  }

  return testimonials.map(mapPublicTestimonial);
}

export async function getAdminTestimonialsView(env) {
  const testimonials = await getAdminTestimonials(env);

  if (!testimonials.length && !env?.DB) {
    return seedCatalog.testimonials.map(mapSeedTestimonial);
  }

  return testimonials.map(mapAdminTestimonial);
}

export async function replaceAdminTestimonials(env, input) {
  const validation = validateAdminTestimonialsInput(input);

  if (!validation.valid) {
    return {
      ok: false,
      status: 400,
      error: "Validation failed",
      details: validation.errors
    };
  }

  const savedTestimonials = await replaceTestimonials(env, normalizeInput(input));

  return {
    ok: true,
    testimonials: savedTestimonials.map(mapAdminTestimonial)
  };
}
