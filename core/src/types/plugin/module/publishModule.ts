/*
 * Copyright (C) 2018-2020 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { dedent } from "../../../util/string"
import { GardenModule } from "../../module"
import { PluginModuleActionParamsBase, moduleActionParamsSchema } from "../base"
import { joi } from "../../../config/common"

export interface PublishModuleParams<T extends GardenModule = GardenModule> extends PluginModuleActionParamsBase<T> {}

export interface PublishResult {
  published: boolean
  message?: string
}

export const publishResultSchema = () =>
  joi.object().keys({
    published: joi
      .boolean()
      .required()
      .description("Set to true if the module was published."),
    message: joi.string().description("Optional result message from the provider."),
  })

export const publishModule = () => ({
  description: dedent`
    Publish a built module to a remote registry.

    Called by the \`garden publish\` command.
  `,
  paramsSchema: moduleActionParamsSchema(),
  resultSchema: publishResultSchema(),
})
