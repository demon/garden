/*
 * Copyright (C) 2018 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Bluebird from "bluebird"
import chalk from "chalk"
import pluralize from "pluralize"
import { Module, getModuleKey } from "../types/module"
import { BuildResult } from "../types/plugin/module/build"
import { BaseTask, TaskType } from "../tasks/base"
import { Garden } from "../garden"
import { LogEntry } from "../logger/log-entry"

export interface StageBuildTaskParams {
  garden: Garden
  log: LogEntry
  module: Module
  force: boolean
}

export class StageBuildTask extends BaseTask {
  type: TaskType = "stage-build"

  private module: Module

  constructor({ garden, log, module, force }: StageBuildTaskParams) {
    super({ garden, log, force, version: module.version })
    this.module = module
  }

  async getDependencies() {
    const dg = await this.garden.getConfigGraph()
    const deps = (await dg.getDependencies("build", this.getName(), false)).build

    return Bluebird.map(deps, async (m: Module) => {
      return new StageBuildTask({
        garden: this.garden,
        log: this.log,
        module: m,
        force: this.force,
      })
    })
  }

  getName() {
    return getModuleKey(this.module.name, this.module.plugin)
  }

  getDescription() {
    return `staging build for ${this.getName()}`
  }

  async process(): Promise<BuildResult> {
    let log: LogEntry | undefined = undefined

    if (this.module.version.files.length > 0) {
      log = this.log.info({
        section: this.getName(),
        msg: `Syncing module sources (${pluralize("file", this.module.version.files.length, true)})...`,
        status: "active",
      })
    }

    const graph = await this.garden.getConfigGraph()
    await this.garden.buildDir.syncFromSrc(this.module, log || this.log)
    await this.garden.buildDir.syncDependencyProducts(this.module, graph, log || this.log)

    if (log) {
      log.setSuccess({
        msg: chalk.green(`Done (took ${log.getDuration(1)} sec)`),
        append: true,
      })
    }

    return {}
  }
}
