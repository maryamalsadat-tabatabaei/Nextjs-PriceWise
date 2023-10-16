"use server";

import axios from "axios";
import * as cheerio from "cheerio";
import { extractCurrency, extractDescription, extractPrice } from "../utils";

export async function scrapeAmazonProduct(url: string) {
  if (!url) return;

  // BrightData proxy configuration
  const userName = String(process.env.BRIGHT_DATA_USERNAME);
  const password = String(process.env.BRIGHT_DATA_PASSWORD);
  const session_id = (1000000 * Math.random()) | 0;

  const options = {
    auth: {
      username: `${userName}-session-${session_id}`,
      password,
    },
    host: "brd.superproxy.io",
    port: 22225,
    rejectUnauthorized: false,
  };

  try {
    // Fetch the product page
    const response = await axios.get(url, options);
    const $ = cheerio.load(response.data);

    // Extract the product information
    const title = $("#productTitle").text().trim();
    const currentPrice = extractPrice(
      $(".priceToPay span.a-price-whole"),
      $(".a.size.base.a-color-price"),
      $(".a-button-selected .a-color-base"),
      $(".a-price.a-text-price")
    );

    const originalPrice = extractPrice(
      $("#priceblock_ourprice"),
      $(".a-price.a-text-price span.a-offscreen"),
      $("#listPrice"),
      $("#priceblock_dealprice"),
      $(".a-size-base.a-color-price")
    );

    const outOfStock =
      $("#availability span").text().trim().toLowerCase() ===
      "currently unavailable";

    const images =
      $("#imgBlkFront").attr("data-a-dynamic-image") ||
      $("#landingImage").attr("data-a-dynamic-image") ||
      "{}";

    const imageUrls = Object.keys(JSON.parse(images));

    const currency = extractCurrency($(".a-price-symbol"));
    const discountRate = $(".savingsPercentage").text().replace(/[-%]/g, "");

    const description = extractDescription($);

    const ratingStar = $(
      "#averageCustomerReviews span.a-size-base.a-color-base"
    )
      .text()
      .trim();

    const ratingsCount = $("#acrCustomerReviewText")
      .text()
      .trim()
      .replace(/[^\d,]/g, "");
    const category = $("#nav-subnav").attr("data-category") || "category";
    const reviewTitleList = <string[]>[];
    $('span[data-hook="review-title"]').each((_, element) => {
      const title = $(element).text().trim();
      reviewTitleList.push(title);
    });

    // Construct data object with scraped information
    const data = {
      url,
      currency: currency || "$",
      image: imageUrls[0],
      title,
      currentPrice: Number(currentPrice) || Number(originalPrice),
      originalPrice: Number(originalPrice) || Number(currentPrice),
      priceHistory: [],
      discountRate: Number(discountRate),
      category,
      reviewsCount: ratingsCount,
      isOutOfStock: outOfStock,
      description,
      lowestPrice: Number(currentPrice) || Number(originalPrice),
      highestPrice: Number(originalPrice) || Number(currentPrice),
      averagePrice: Number(currentPrice) || Number(originalPrice),
      stars: Number(ratingStar),
      reviews: reviewTitleList,
    };
    return data;
  } catch (error: any) {
    console.log(error);
  }
}
