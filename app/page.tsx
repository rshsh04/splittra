"use client";
import Link from "next/link";
import { useState } from "react";


export default function Home() {
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome to SplitIt</h1>
      <p className="text-gray-700">Please log in or sign up to continue.</p>
      <Link href="/login">
        <button className="bg-blue-500 text-white px-4 py-2 rounded">Log in</button>
      </Link>
    </div>
  );
}
