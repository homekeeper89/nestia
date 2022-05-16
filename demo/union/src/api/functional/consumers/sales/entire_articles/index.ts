/**
 * @packageDocumentation
 * @module api.functional.consumers.sales.entire_articles
 * @nestia Generated by Nestia - https://github.com/samchon/nestia 
 */
//================================================================
import { Fetcher, Primitive } from "nestia-fetcher";
import type { IConnection } from "nestia-fetcher";

import type { ISaleInquiry } from "./../../../../structures/ISaleInquiry";
import type { IPage } from "./../../../../structures/IPage";
import type { ISaleEntireArtcle } from "./../../../../structures/ISaleEntireArticle";

/**
 * List up entire sale articles.
 * 
 * @param connection connection Information of the remote HTTP(s) server with headers (+encryption password)
 * @param request Instance of the Express.Request
 * @param section Code of the target section
 * @param saleId ID of the target sale
 * @param input Page request info
 * @returns Paged the entire articles
 * 
 * @controller ConsumerSaleEntireArticlesController.index()
 * @path PATCH /consumers/:section/sales/:saleId/entire_articles
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
export function index
    (
        connection: IConnection,
        section: string,
        saleId: number,
        input: Primitive<index.Input>
    ): Promise<index.Output>
{
    return Fetcher.fetch
    (
        connection,
        index.ENCRYPTED,
        index.METHOD,
        index.path(section, saleId),
        input
    );
}
export namespace index
{
    export type Input = Primitive<ISaleInquiry.IRequest>;
    export type Output = Primitive<IPage<ISaleEntireArtcle.ISummary>>;

    export const METHOD = "PATCH" as const;
    export const PATH: string = "/consumers/:section/sales/:saleId/entire_articles";
    export const ENCRYPTED: Fetcher.IEncrypted = {
        request: false,
        response: false,
    };

    export function path(section: string, saleId: number): string
    {
        return `/consumers/${section}/sales/${saleId}/entire_articles`;
    }
}

/**
 * Get detailed sale article record.
 * 
 * @param connection connection Information of the remote HTTP(s) server with headers (+encryption password)
 * @param request Instance of the Express.Request
 * @param section Code of the target section
 * @param saleId ID of the target sale
 * @param id ID of the target article
 * @returns The detailed article record
 * 
 * @controller ConsumerSaleEntireArticlesController.at()
 * @path GET /consumers/:section/sales/:saleId/entire_articles/:id
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
export function at
    (
        connection: IConnection,
        section: string,
        saleId: number,
        id: number
    ): Promise<at.Output>
{
    return Fetcher.fetch
    (
        connection,
        at.ENCRYPTED,
        at.METHOD,
        at.path(section, saleId, id)
    );
}
export namespace at
{
    export type Output = Primitive<ISaleEntireArtcle>;

    export const METHOD = "GET" as const;
    export const PATH: string = "/consumers/:section/sales/:saleId/entire_articles/:id";
    export const ENCRYPTED: Fetcher.IEncrypted = {
        request: false,
        response: false,
    };

    export function path(section: string, saleId: number, id: number): string
    {
        return `/consumers/${section}/sales/${saleId}/entire_articles/${id}`;
    }
}