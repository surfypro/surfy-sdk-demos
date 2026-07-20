//#region src/surfy-sdk/constants.ts
/** Published SDK semver — bump on public API changes. */
var SURFY_SDK_VERSION = "0.2.0";
//#endregion
//#region src/surfy-sdk/client/surfyHttp.helper.ts
function normalizeSurfyBaseUrl(baseUrl) {
	return baseUrl.replace(/\/$/, "");
}
async function buildSurfyApiHeaders(auth) {
	return {
		Accept: "application/json",
		"Content-Type": "application/json",
		Authorization: `Bearer ${await auth.getAccessToken()}`,
		"x-tenant": auth.tenant,
		"accept-language": auth.locale ?? "en",
		"X-Surfy-Sdk-Version": SURFY_SDK_VERSION
	};
}
function createSurfyHttpError(message, status) {
	const error = new Error(message);
	error.status = status;
	return error;
}
/**
* Isomorphic Surfy HTTP helper — uses `globalThis.fetch` only (browser + Node 18+).
* Does not touch `window` / `document`.
*/
async function surfyFetchJson(auth, path, init = {}) {
	const url = `${normalizeSurfyBaseUrl(auth.baseUrl)}${path.startsWith("/") ? path : `/${path}`}`;
	const headers = await buildSurfyApiHeaders(auth);
	const response = await fetch(url, {
		method: init.method ?? "GET",
		headers,
		body: init.body === void 0 ? void 0 : JSON.stringify(init.body),
		signal: init.signal
	});
	if (!response.ok) {
		const detail = await response.text().catch(() => "");
		throw createSurfyHttpError(`Surfy request failed (${response.status})${detail ? `: ${detail}` : ""}`, response.status);
	}
	return response.json();
}
//#endregion
//#region src/surfy-sdk/client/SurfyClient.ts
var SURFY_ENTITIES_ROUTE = "/api/v1/data/entities";
/**
* Isomorphic Surfy data client — inject `baseUrl` (origin) at creation.
* Primary API: {@link SurfyClient.fetchEntities} with your own QueryNode
* (business queries stay in the app, not in the SDK).
*/
var SurfyClient = class SurfyClient {
	auth;
	constructor(options) {
		this.auth = {
			baseUrl: options.baseUrl,
			tenant: options.tenant,
			getAccessToken: options.getAccessToken,
			locale: options.locale
		};
	}
	static create(options) {
		if (!options.baseUrl?.trim()) throw new Error("SurfyClient.create: baseUrl (API origin) is required");
		if (!options.tenant?.trim()) throw new Error("SurfyClient.create: tenant is required");
		if (typeof options.getAccessToken !== "function") throw new Error("SurfyClient.create: getAccessToken is required");
		return new SurfyClient(options);
	}
	get baseUrl() {
		return this.auth.baseUrl;
	}
	get tenant() {
		return this.auth.tenant;
	}
	/**
	* POST `/api/v1/data/entities` — pass any QueryNode you build in app code.
	*/
	async fetchEntities(queryNode, signal) {
		return [...(await surfyFetchJson(this.auth, "/api/v1/data/entities", {
			method: "POST",
			body: { queryNode },
			signal
		})).entities ?? []];
	}
};
//#endregion
//#region src/surfy-sdk/client/queryNode.models.ts
function createFilter(operator, column, value) {
	return {
		operator,
		column,
		value
	};
}
//#endregion
export { SURFY_ENTITIES_ROUTE, SurfyClient, buildSurfyApiHeaders, createFilter, createSurfyHttpError, normalizeSurfyBaseUrl, surfyFetchJson };
