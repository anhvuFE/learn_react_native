import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  from,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { Platform } from "react-native";
import { auth } from "./firebase";

function defaultApiUrl() {
  if (Platform.OS === "android") return "http://10.0.2.2:3000/graphql";
  return "http://localhost:3000/graphql";
}

const uri = process.env.EXPO_PUBLIC_API_URL ?? defaultApiUrl();

const httpLink = new HttpLink({ uri });

const authLink = setContext(async (_op, prevCtx) => {
  const headers = (prevCtx as { headers?: Record<string, string> }).headers ?? {};
  const user = auth.currentUser;
  if (!user) return { headers };
  try {
    const token = await user.getIdToken();
    return {
      headers: {
        ...headers,
        Authorization: `Bearer ${token}`,
      },
    };
  } catch {
    return { headers };
  }
});

export const apolloClient = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: "cache-and-network" },
  },
});

export const API_URL = uri;
