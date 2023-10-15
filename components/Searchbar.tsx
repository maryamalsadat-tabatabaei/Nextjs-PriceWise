"use client";

import { ScrapeAndStoreProduct } from "@/lib/actions";
import { useState, FormEvent } from "react";

function Searchbar() {
  const [searchUrl, setseachUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isValidAmazonUrl = (string: string): boolean => {
    const urlString = new URL(string);
    const urlHostname = urlString.hostname;
    if (urlHostname.includes("amazon.com")) {
      return true;
    } else {
      return false;
    }
  };

  const submitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      if (!isValidAmazonUrl) {
        return alert("Please provide a valid amazon link");
      }
      await ScrapeAndStoreProduct(searchUrl);
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
        onChange={(e) => setseachUrl(e.target.value)}
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
