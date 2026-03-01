/**
 *
 * export interface AddTableParams {
 *     name: string;
 *     seats: number;
 *     minPersons?: number;
 *     reservable: boolean;
 * }
 *
 * export async function addTable(params: AddTableParams, ctx: ApiContext) {
 *     const tableId =  v4()
 *     const response = await apiRequest(
 *         `${commandEndpoints.addTable}/${tableId}`,
 *         ctx,
 *         {
 *             method: "POST",
 *             body: {
 *                 tableid: tableId,
 *                 ...params,
 *             },
 *         }
 *     );
 *     if (!response.ok) {
 *         throw new Error(response.error);
 *     }
 *     return response.data;
 * }
 */