/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as authHelpers from "../authHelpers.js";
import type * as defaultItems from "../defaultItems.js";
import type * as items from "../items.js";
import type * as luggage from "../luggage.js";
import type * as tripItems from "../tripItems.js";
import type * as trips from "../trips.js";
import type * as users from "../users.js";
import type * as weather from "../weather.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  authHelpers: typeof authHelpers;
  defaultItems: typeof defaultItems;
  items: typeof items;
  luggage: typeof luggage;
  tripItems: typeof tripItems;
  trips: typeof trips;
  users: typeof users;
  weather: typeof weather;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
