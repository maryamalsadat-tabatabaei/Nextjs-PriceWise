"use client";

import { ScrapeAndStoreProduct } from "@/lib/actions";
import { useState, FormEvent } from "react";

const isValidAmazonProductURL = (url: string) => {
  try {
    const parsedURL = new URL(url);
    const hostname = parsedURL.hostname;

    if (
      hostname.includes("amazon.com") ||
      hostname.includes("amazon.") ||
      hostname.endsWith("amazon")
    ) {
      return true;
    }
  } catch (error) {
    return false;
  }

  return false;
};

function Searchbar() {
  const [searchUrl, setSeachUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const isValidLink = isValidAmazonProductURL(searchUrl);

    if (!isValidLink) return alert("Please provide a valid Amazon link");

    try {
      setIsLoading(true);

      // Scrape the product page
      await ScrapeAndStoreProduct(searchUrl);
      setSeachUrl("");
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <form className="flex flex-wrap gap-4 mt-12" onSubmit={submitHandler}>
      <input
        value={searchUrl}
        onChange={(e) => setSeachUrl(e.target.value)}
        type="text"
        placeholder="Enter product link"
        className="searchbar-input"
      />

      <button type="submit" className="searchbar-btn">
        {isLoading ? "Searching" : "Search"}
      </button>
    </form>
  );
}

export default Searchbar;
