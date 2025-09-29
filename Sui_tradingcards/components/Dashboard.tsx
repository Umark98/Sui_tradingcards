"use client";

import { useState } from "react";
import SearchBar from "./SearchBar";
import Button from "./Button";
import NFTTable from "./NFTTable";

export default function Dashboard() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // fetch NFTs by email
  const handleSearch = async (emailParam?: string) => {
    const emailToSearch = emailParam || search;
    if (!emailToSearch) return;

    setHasSearched(true); // mark that search was attempted

    const response = await fetch(
      `/api/nft_through_email?email=${encodeURIComponent(emailToSearch)}`
    );
    const data = await response.json();
    if (data && !data.error) {
      setItems(data);
    } else {
      setItems([]);
    }
  };

  return (
    <div className="p-4">
      {/* Search bar and button */}
      <div className="flex items-center   ">
        <SearchBar
          search={search}
          setSearch={setSearch}
          onSelectUser={(email) => {
            setSearch(email);
            handleSearch(email); 
          }}
        />
        <Button onClick={() => handleSearch()}>Search Users</Button>
      </div>


      {hasSearched && <NFTTable items={items} />}
    </div>
  );
}
