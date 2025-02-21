import { Escaper } from "typia/lib/utils/Escaper";

import { IMigrateRoute } from "../structures/IMigrateRoute";
import { ISwaggerSchema } from "../structures/ISwaggeSchema";
import { ISwagger } from "../structures/ISwagger";
import { ISwaggerComponents } from "../structures/ISwaggerComponents";
import { ISwaggerRoute } from "../structures/ISwaggerRoute";
import { JsonTypeChecker } from "../utils/JsonTypeChecker";
import { StringUtil } from "../utils/StringUtil";
import { SchemaProgrammer } from "./SchemaProgrammer";

export namespace RouteProgrammer {
    export const analyze =
        (swagger: ISwagger) =>
        (props: { path: string; method: string }) =>
        (route: ISwaggerRoute): IMigrateRoute | null => {
            const body = emplaceBodySchema(emplaceReference(swagger)("body"))(
                route.requestBody,
            );
            const response = emplaceBodySchema(
                emplaceReference(swagger)("response"),
            )(route.responses?.["201"] ?? route.responses?.["200"]);
            if (body === false || response === false) {
                console.log(
                    `Failed to migrate ${props.method.toUpperCase()} ${
                        props.path
                    }: @nestia/migrate supports only application/json or text/plain format yet.`,
                );
                return null;
            } else if (
                SUPPORTED_METHODS.has(props.method.toUpperCase()) === false
            ) {
                console.log(
                    `Failed to migrate ${props.method.toUpperCase()} ${
                        props.path
                    }: @nestia/migrate does not support ${props.method.toUpperCase()} method.`,
                );
                return null;
            }

            const [headers, query] = ["header", "query"].map((type) => {
                const parameters = (route.parameters ?? []).filter(
                    (p) => p.in === type,
                );
                if (parameters.length === 0) return null;

                const objects = parameters
                    .map((p) =>
                        JsonTypeChecker.isObject(p.schema)
                            ? p.schema
                            : JsonTypeChecker.isReference(p.schema) &&
                              JsonTypeChecker.isObject(
                                  (swagger.components.schemas ?? {})[
                                      p.schema.$ref.replace(
                                          `#/components/schemas/`,
                                          ``,
                                      )
                                  ] ?? {},
                              )
                            ? p.schema
                            : null!,
                    )
                    .filter((s) => !!s);
                const primitives = parameters.filter(
                    (p) =>
                        JsonTypeChecker.isBoolean(p.schema) ||
                        JsonTypeChecker.isNumber(p.schema) ||
                        JsonTypeChecker.isInteger(p.schema) ||
                        JsonTypeChecker.isString(p.schema) ||
                        JsonTypeChecker.isArray(p.schema),
                );
                if (objects.length === 1 && primitives.length === 0)
                    return objects[0];
                else if (objects.length > 1)
                    throw new Error(
                        `Error on nestia.migrate.RouteProgrammer.analze(): ${type} typed parameters must be only one object type - ${StringUtil.capitalize(
                            props.method,
                        )} "${props.path}".`,
                    );

                const dto: ISwaggerSchema.IObject | null = objects[0]
                    ? JsonTypeChecker.isObject(objects[0])
                        ? objects[0]
                        : ((swagger.components.schemas ?? {})[
                              (
                                  objects[0] as ISwaggerSchema.IReference
                              ).$ref.replace(`#/components/schemas/`, ``)
                          ] as ISwaggerSchema.IObject)
                    : null;
                const entire: ISwaggerSchema.IObject[] = [
                    ...objects.map((o) =>
                        JsonTypeChecker.isObject(o)
                            ? o
                            : (swagger.components.schemas?.[
                                  o.$ref.replace(`#/components/schemas/`, ``)
                              ]! as ISwaggerSchema.IObject),
                    ),
                    {
                        type: "object",
                        properties: Object.fromEntries([
                            ...primitives.map((p) => [
                                p.name,
                                {
                                    ...p.schema,
                                    description:
                                        p.schema.description ?? p.description,
                                },
                            ]),
                            ...(dto
                                ? Object.entries(dto.properties ?? {})
                                : []),
                        ]),
                        required: [
                            ...primitives
                                .filter((p) => p.required)
                                .map((p) => p.name!),
                            ...(dto ? dto.required ?? [] : []),
                        ],
                    },
                ];
                return parameters.length === 0
                    ? null
                    : emplaceReference(swagger)(
                          StringUtil.pascal(`I/Api/${props.path}`) +
                              "." +
                              StringUtil.pascal(`${props.method}/${type}`),
                      )({
                          type: "object",
                          properties: Object.fromEntries([
                              ...new Map<string, ISwaggerSchema>(
                                  entire
                                      .map((o) =>
                                          Object.entries(
                                              o.properties ?? {},
                                          ).map(
                                              ([name, schema]) =>
                                                  [
                                                      name,
                                                      {
                                                          ...schema,
                                                          description:
                                                              schema.description ??
                                                              schema.description,
                                                      } as ISwaggerSchema,
                                                  ] as const,
                                          ),
                                      )
                                      .flat(),
                              ),
                          ]),
                          required: [
                              ...new Set(
                                  entire.map((o) => o.required ?? []).flat(),
                              ),
                          ],
                      });
            });

            const parameterNames: string[] = StringUtil.splitWithNormalization(
                props.path,
            )
                .filter((str) => str[0] === "{" || str[0] === ":")
                .map((str) =>
                    str[0] === "{"
                        ? str.substring(1, str.length - 1)
                        : str.substring(1),
                );
            if (
                parameterNames.length !==
                (route.parameters ?? []).filter((p) => p.in === "path").length
            ) {
                console.log(
                    `Failed to migrate ${props.method.toUpperCase()} ${
                        props.path
                    }: number of path parameters are not matched with its full path.`,
                );
                return null;
            }
            return {
                name: "@lazy",
                path: props.path,
                method: props.method,
                headers,
                parameters: (route.parameters ?? [])
                    .filter((p) => p.in === "path")
                    .map((p, i) => ({
                        key: (() => {
                            let key: string = StringUtil.normalize(
                                parameterNames[i],
                            );
                            if (Escaper.variable(key)) return key;

                            while (true) {
                                key = "_" + key;
                                if (!parameterNames.some((s) => s === key))
                                    return key;
                            }
                        })(),
                        schema: {
                            ...p.schema,
                            description: p.schema.description ?? p.description,
                        },
                    })),
                query,
                body,
                response,
                description: describe(route),
                "x-nestia-jsDocTags": route["x-nestia-jsDocTags"],
            };
        };

    const describe = (route: ISwaggerRoute): string | undefined => {
        const commentTags: string[] = [];
        const add = (text: string) => {
            if (commentTags.every((line) => line !== text))
                commentTags.push(text);
        };

        let description: string | undefined = route.description;
        if (route.summary) {
            const emended: string = route.summary.endsWith(".")
                ? route.summary
                : route.summary + ".";
            if (
                description !== undefined &&
                !description?.startsWith(route.summary) &&
                !route["x-nestia-jsDocTags"]?.some((t) => t.name === "summary")
            )
                description = `${emended}\n${description}`;
        }
        if (route.tags) route.tags.forEach((name) => add(`@tag ${name}`));
        if (route.deprecated) add("@deprecated");
        for (const security of route.security ?? [])
            for (const [name, scopes] of Object.entries(security))
                add(`@security ${[name, ...scopes].join("")}`);
        for (const jsDocTag of route["x-nestia-jsDocTags"] ?? [])
            if (jsDocTag.text?.length)
                add(
                    `@${jsDocTag.name} ${jsDocTag.text
                        .map((text) => text.text)
                        .join("")}`,
                );
            else add(`@${jsDocTag.name}`);
        return description?.length
            ? commentTags.length
                ? `${description}\n\n${commentTags.join("\n")}`
                : description
            : commentTags.join("\n");
    };

    const isNotObjectLiteral = (schema: ISwaggerSchema): boolean =>
        JsonTypeChecker.isReference(schema) ||
        JsonTypeChecker.isBoolean(schema) ||
        JsonTypeChecker.isNumber(schema) ||
        JsonTypeChecker.isString(schema) ||
        JsonTypeChecker.isUnknown(schema) ||
        (JsonTypeChecker.isAnyOf(schema) &&
            schema.anyOf.every(isNotObjectLiteral)) ||
        (JsonTypeChecker.isOneOf(schema) &&
            schema.oneOf.every(isNotObjectLiteral)) ||
        (JsonTypeChecker.isArray(schema) && isNotObjectLiteral(schema.items));

    const emplaceBodySchema =
        (emplacer: (schema: ISwaggerSchema) => ISwaggerSchema.IReference) =>
        (meta?: {
            description?: string;
            content?: ISwaggerRoute.IContent;
            "x-nestia-encrypted"?: boolean;
        }): false | null | IMigrateRoute.IBody => {
            if (!meta?.content) return null;

            const entries: [string, { schema: ISwaggerSchema }][] =
                Object.entries(meta.content);
            const json = entries.find((e) =>
                meta["x-nestia-encrypted"] === true
                    ? e[0].includes("text/plain") ||
                      e[0].includes("application/json")
                    : e[0].includes("application/json"),
            );

            if (json) {
                const { schema } = json[1];
                return {
                    type: "application/json",
                    schema: isNotObjectLiteral(schema)
                        ? schema
                        : emplacer(schema),
                    "x-nestia-encrypted": meta["x-nestia-encrypted"],
                };
            }

            const text = entries.find((e) => e[0].includes("text/plain"));
            if (text) return { type: "text/plain", schema: { type: "string" } };
            return false;
        };

    const emplaceReference =
        (swagger: ISwagger) =>
        (name: string) =>
        (schema: ISwaggerSchema): ISwaggerSchema.IReference => {
            swagger.components.schemas ??= {};
            swagger.components.schemas[name] = schema;
            return { $ref: `#/components/schemas/${name}` };
        };

    export const write =
        (importer: (module: string) => (instance: string) => string) =>
        (components: ISwaggerComponents) =>
        (references: ISwaggerSchema.IReference[]) =>
        (route: IMigrateRoute): string => {
            const output: string = route.response
                ? SchemaProgrammer.write(components)(references)(
                      route.response.schema,
                  )
                : "void";

            const methoder = (composer: (name: string) => string) =>
                `${composer(
                    StringUtil.capitalize(route.method),
                )}(${JSON.stringify(route.path)})`;
            const decorator: string[] =
                route.response?.["x-nestia-encrypted"] === true
                    ? [
                          `@${importer("@nestia/core")(
                              "EncryptedRoute",
                          )}.${methoder((str) => str)}`,
                      ]
                    : route.response?.type === "text/plain"
                    ? [
                          `@${importer("@nestjs/common")(
                              "Header",
                          )}("Content-Type", "text/plain")`,
                          `@${methoder((str) =>
                              importer("@nestjs/common")(str),
                          )}`,
                      ]
                    : route.method === "head"
                    ? [
                          `@${importer("@nestjs/common")("Head")}${methoder(
                              () => "",
                          )}`,
                      ]
                    : [
                          `@${importer("@nestia/core")(
                              "TypedRoute",
                          )}.${methoder((str) => str)}`,
                      ];
            const content: string[] = [
                ...(route.description
                    ? [
                          "/**",
                          ...route.description
                              .split("\n")
                              .map((line) => ` * ${line}`),
                          " */",
                      ]
                    : []),
                ...decorator,
                `public async ${route.name}(`,
                ...route.parameters.map(
                    (param) =>
                        `    ${writeParameter(components)(importer)(param)},`,
                ),
                ...(route.headers
                    ? [
                          `    @${importer("@nestia/core")(
                              "TypedHeaders",
                          )}() headers: ${SchemaProgrammer.write(components)(
                              references,
                          )(route.headers)},`,
                      ]
                    : []),
                ...(route.query
                    ? [
                          `    @${importer("@nestia/core")(
                              "TypedQuery",
                          )}() query: ${SchemaProgrammer.write(components)(
                              references,
                          )(route.query)},`,
                      ]
                    : []),
                ...(route.body
                    ? route.body["x-nestia-encrypted"] === true
                        ? [
                              `    @${importer("@nestia/core")(
                                  "EncryptedBody",
                              )}() body: ${SchemaProgrammer.write(components)(
                                  references,
                              )(route.body.schema)},`,
                          ]
                        : route.body.type === "application/json"
                        ? [
                              `    @${importer("@nestia/core")(
                                  "TypedBody",
                              )}() body: ${SchemaProgrammer.write(components)(
                                  references,
                              )(route.body.schema)},`,
                          ]
                        : [
                              `    @${importer("@nestia/core")(
                                  "PlainBody",
                              )}() body: string,`,
                          ]
                    : []),
                `): Promise<${output}> {`,
                ...route.parameters.map(
                    (p) => `    ${StringUtil.normalize(p.key)};`,
                ),
                ...(route.headers ? ["    headers;"] : []),
                ...(route.query ? ["    query;"] : []),
                ...(route.body ? ["    body;"] : []),
                ...(output !== "void"
                    ? [
                          `    return ${importer("typia")(
                              "random",
                          )}<${output}>();`,
                      ]
                    : []),
                `}`,
            ];
            return content.join("\n");
        };

    const writeParameter =
        (components: ISwaggerComponents) =>
        (importer: (library: string) => (instance: string) => string) =>
        ({ key, schema }: IMigrateRoute.IParameter): string => {
            const variable = StringUtil.normalize(key);
            const format =
                JsonTypeChecker.isString(schema) &&
                (schema.format === "uuid" || schema.format === "date")
                    ? schema.format
                    : null;
            return `@${importer("@nestia/core")("TypedParam")}(${JSON.stringify(
                key,
            )}${
                format ? `, ${JSON.stringify(format)}` : ""
            }) ${variable}: ${SchemaProgrammer.write(components)([])(schema)}`;
        };
}

const SUPPORTED_METHODS: Set<string> = new Set([
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "HEAD",
]);
