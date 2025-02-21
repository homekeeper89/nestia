import typia from "typia";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";
import { IPage } from "@api/lib/structures/IPage";

export const test_api_query_null = async (
    connection: api.IConnection,
): Promise<void> => {
    const page: IPage<IBbsArticle.ISummary> =
        await api.functional.bbs.articles.index(connection, "section", {
            page: 1,
            limit: null,
        });
    typia.assert(page);
};
