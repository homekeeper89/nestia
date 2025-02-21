import { IJsDocTagInfo } from "typia/lib/metadata/IJsDocTagInfo";

import { ISwaggerSchema } from "./ISwaggeSchema";

export interface IMigrateRoute {
    name: string;
    path: string;
    method: string;
    parameters: IMigrateRoute.IParameter[];
    headers: ISwaggerSchema | null;
    query: ISwaggerSchema | null;
    body: IMigrateRoute.IBody | null;
    response: IMigrateRoute.IBody | null;
    description?: string;
    "x-nestia-jsDocTags"?: IJsDocTagInfo[];
}
export namespace IMigrateRoute {
    export interface IParameter {
        key: string;
        schema: ISwaggerSchema;
        description?: string;
    }
    export interface IBody {
        type: "text/plain" | "application/json";
        schema: ISwaggerSchema;
        "x-nestia-encrypted"?: boolean;
    }
}
