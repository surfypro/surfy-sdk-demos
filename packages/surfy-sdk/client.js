//#region src/surfy-sdk/client/queryNode.helpers.ts
function createFilter(operator, column, value) {
	return {
		operator,
		column,
		value
	};
}
//#endregion
//#region src/surfy-sdk/constants.ts
/** Published SDK semver — bump on public API changes. */
var SURFY_SDK_VERSION = "0.3.0";
//#endregion
//#region src/surfy-sdk/client/surfyHttp.helper.ts
function normalizeSurfyBaseUrl(baseUrl) {
	return baseUrl.replace(/\/$/, "");
}
var CLIENT_SECRET_KEY = "clientSecret";
/**
* Runtime guard: options must never carry `clientSecret` (even via casts / spreads).
* Throws before any network I/O so secrets cannot leak into headers or JSON bodies.
*/
function assertNoClientSecretInOptions(options) {
	if (!Object.hasOwn(options, CLIENT_SECRET_KEY)) return;
	if (options[CLIENT_SECRET_KEY] === void 0) return;
	throw new Error("Surfy SDK: clientSecret is not allowed in client options — use getAccessToken only");
}
async function buildSurfyApiHeaders(auth) {
	assertNoClientSecretInOptions(auth);
	return {
		Accept: "application/json",
		"Content-Type": "application/json",
		Authorization: `Bearer ${await auth.getAccessToken()}`,
		"x-tenant": auth.tenant,
		"accept-language": auth.locale ?? "en",
		"X-Surfy-Sdk-Version": SURFY_SDK_VERSION
	};
}
/** Map HTTP status to public SDK error codes (401 auth / 403 entitlement). */
function mapHttpStatusToSurfySdkErrorCode(status) {
	if (status === 401) return "AUTH_EXPIRED";
	if (status === 403) return "AUTH_FORBIDDEN";
	if (status === 404) return "LAYOUT_NOT_FOUND";
	return "NETWORK";
}
function createSurfyHttpError(message, status, code = mapHttpStatusToSurfySdkErrorCode(status)) {
	const error = new Error(message);
	Object.assign(error, {
		status,
		code
	});
	return error;
}
function mapSurfyHttpErrorToDetail(error, fallbackMessage = "Surfy request failed") {
	const status = error?.status;
	return {
		code: error?.code ?? (typeof status === "number" ? mapHttpStatusToSurfySdkErrorCode(status) : "NETWORK"),
		message: error?.message ?? fallbackMessage
	};
}
/**
* Isomorphic Surfy HTTP helper — uses `globalThis.fetch` only (browser + Node 18+).
* Does not touch `window` / `document`.
*/
async function surfyFetchJson(auth, path, init = {}) {
	assertNoClientSecretInOptions(auth);
	if (init.body && typeof init.body === "object") assertNoClientSecretInOptions(init.body);
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
		assertNoClientSecretInOptions(options);
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
export { SURFY_ENTITIES_ROUTE, SurfyClient, buildSurfyApiHeaders, createFilter, createSurfyHttpError, mapHttpStatusToSurfySdkErrorCode, mapSurfyHttpErrorToDetail, normalizeSurfyBaseUrl, surfyFetchJson };
