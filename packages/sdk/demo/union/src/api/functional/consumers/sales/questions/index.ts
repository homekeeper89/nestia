/**
 * @packageDocumentation
 * @module api.functional.consumers.sales.questions
 * @nestia Generated by Nestia - https://github.com/samchon/nestia 
 */
//================================================================
import { Fetcher } from "@nestia/fetcher";
import type { IConnection } from "@nestia/fetcher";

import type { ISaleInquiry } from "./../../../../structures/ISaleInquiry";
import type { IPage } from "./../../../../structures/IPage";

/**
 * @controller ConsumerSaleQuestionsController.index()
 * @path PATCH /consumers/:section/sales/:saleId/questions
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
export async function index
    (
        connection: IConnection,
        section: string,
        saleId: number,
        ipAddr: string,
        href: string,
        input: ISaleInquiry.IRequest
    ): Promise<index.Output>
{
    return Fetcher.fetch
    (
        connection,
        index.ENCRYPTED,
        index.METHOD,
        index.path(section, saleId, ipAddr, href),
        input
    );
}
export namespace index
{
    export type Input = ISaleInquiry.IRequest;
    export type Output = IPage<ISaleInquiry.ISummary>;

    export const METHOD = "PATCH" as const;
    export const PATH: string = "/consumers/:section/sales/:saleId/questions";
    export const ENCRYPTED: Fetcher.IEncrypted = {
        request: false,
        response: false,
    };

    export function path(section: string, saleId: number, ipAddr: string, href: string): string
    {
        return `/consumers/${encodeURIComponent(section)}/sales/${encodeURIComponent(saleId)}/questions?${new URLSearchParams(
        {
            ip: ipAddr,
            "location.href": href
        } as any).toString()}`;
    }
}