import chalk from "chalk";
import fetch from "node-fetch-extra";

import updateManga from "../util/updateManga";
import db from "../db";
import { List } from "../types";

export async function getLists(justHome: boolean = false): Promise<List[]> {
	// Get lists from database
	let lists: List[] = db.get("lists");

	// Remove creator items from db results. There shouldn't be any, but I hope that this is what fixes Destruc7i0n's bug.
	lists = lists.filter((l) => !l.byCreator);
	lists = lists.filter((l) => (justHome && l.showOnHome) || !justHome);

	// Now combine the lists
	let updatedLists: List[] = Object.assign([], [...lists]);
	updatedLists = updatedLists.filter((l) => (justHome ? l.showOnHome : true));

	// Add data to each and every entry
	updatedLists = await Promise.all(
		updatedLists.map(async (list) => {
			// Add data to all fields
			list.entries = await Promise.all(
				list.entries.map(async (entry) => {
					entry.data = await updateManga(
						entry.provider ?? "mangasee",
						entry.slug
					);
					return entry;
				})
			);

			// Check for failed requests
			// list.entries = list.entries.filter((entry) => {
			// 	if (!(entry.data.success || !filterUndefineds)) {
			// 		console.info(
			// 			chalk.red("[LISTS]") +
			// 				` ${entry.slug} (${entry.provider}) has failed to load in ${
			// 					list.name
			// 				} (${list.slug}) at ${new Date().toLocaleString("it")}`
			// 		);
			// 	}
			// 	return entry.data.success || !filterUndefineds;
			// });
			return list;
		})
	);

	// Return both database items and creator's suggestions
	return updatedLists;
}
