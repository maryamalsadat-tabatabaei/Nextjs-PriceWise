import { NextResponse } from "next/server";

import {
  getLowestPrice,
  getHighestPrice,
  getAveragePrice,
  getEmailNotifType,
} from "@/lib/utils";
import { connectToDB } from "@/lib/mongoose";
import Product from "@/lib/models/product.model";
import { scrapeAmazonProduct } from "@/lib/scraper";
import { generateEmailBody, sendEmail } from "@/lib/nodemailer";

export const maxDuration = 300; //5 min
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    connectToDB();

    const products = await Product.find({});
    if (!products) throw new Error("No product fetched");

    // 1) SCRAPE LATEST PRODUCT DETAILS
    const updatedProducts = await Promise.all(
      products.map(async (currentProduct) => {
        const scrapedProduct = await scrapeAmazonProduct(currentProduct.url);
        if (!scrapedProduct) return;

        const updatedPriceHistory = [
          ...currentProduct.priceHistory,
          {
            price: scrapedProduct.currentPrice,
          },
        ];

        const product = {
          ...scrapedProduct,
          priceHistory: updatedPriceHistory,
          lowestPrice: getLowestPrice(updatedPriceHistory),
          highestPrice: getHighestPrice(updatedPriceHistory),
          averagePrice: getAveragePrice(updatedPriceHistory),
        };

        // 2) UPDATE PRODUCT IN DB
        const updatedProduct = await Product.findOneAndUpdate(
          {
            url: product.url,
          },
          product
        );

        // 3)  CHECK EACH PRODUCT'S STATUS
        const emailNotificationType = getEmailNotifType(
          scrapedProduct,
          currentProduct
        );

        // 4) SEND EMAIL ACCORDINGLY
        if (emailNotificationType && updatedProduct.users.lenght > 0) {
          const productInfo = {
            title: updatedProduct.title,
            url: updatedProduct.url,
            image: updatedProduct.image,
          };

          // Construct emailContent
          const emailContent = await generateEmailBody(
            productInfo,
            emailNotificationType
          );

          // Get array of user emails
          const userEmails = updatedProduct.users.map(
            (user: any) => user.email
          );

          // Send email notification
          await sendEmail(emailContent, userEmails);
        }

        return updatedProduct;
      })
    );

    return NextResponse.json({
      message: "Ok",
      data: updatedProducts,
    });
  } catch (error: any) {
    throw new Error(`Failed to get all products: ${error.message}`);
  }
}
