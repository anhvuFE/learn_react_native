import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  from,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { firebaseAuth } from "./firebase";

const httpLink = new HttpLink({ uri: import.meta.env.VITE_API_URL });

const authLink = setContext(async (_, { headers }) => {
  const user = firebaseAuth.currentUser;
  const token = user ? await user.getIdToken() : null;
  return {
    headers: {
      ...(headers ?? {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

export const apolloClient = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      User: { keyFields: ["uid"] },
      Family: { keyFields: ["id"] },
      Task: { keyFields: ["id"] },
      Submission: { keyFields: ["id"] },
      Reward: { keyFields: ["id"] },
      RestrictedApp: { keyFields: ["id"] },
      Bank: { keyFields: ["uid"] },
    },
  }),
  defaultOptions: {
    watchQuery: { fetchPolicy: "cache-and-network" },
    query: { fetchPolicy: "network-only" },
  },
});
