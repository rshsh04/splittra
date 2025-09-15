// lib/appwrite-server.ts
import { Client, Databases, Users, Query } from "node-appwrite";

// server SDK (admin access)
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)    // no NEXT_PUBLIC here
  .setProject(process.env.APPWRITE_PROJECT_ID!)      
  .setKey(process.env.APPWRITE_KEY!);         // server API key

export const databases = new Databases(client);
export const users = new Users(client);
export const QueryBuilder = Query;
export { Client };