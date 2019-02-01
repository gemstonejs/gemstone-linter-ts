/*
**  GemstoneJS -- Gemstone JavaScript Technology Stack
**  Copyright (c) 2016-2019 Gemstone Project <http://gemstonejs.com>
**  Licensed under Apache License 2.0 <https://spdx.org/licenses/Apache-2.0>
*/

/*  load external requirements  */
const fs        = require("mz/fs")
const path      = require("path")
const TSLint    = require("tslint")

/*  exported API function  */
module.exports = async function (filenames, opts = {}, report = { sources: {}, findings: [] }) {
    /*  setup TSLint CLI engine  */
    let rules = {}
    Object.assign(rules, opts.rules)
    let linter = new TSLint.Linter({})
    let linterConfigFile = require.resolve("gemstone-config-tslint/tslint.json")

    /*  interate over all source files  */
    let passed = true
    if (typeof opts.progress === "function")
        opts.progress(0.0, "linting TS: starting")
    for (let i = 0; i < filenames.length; i++) {
        /*  indicate progress  */
        if (typeof opts.progress === "function")
            opts.progress(i / filenames.length, `linting TS: ${filenames[i]}`)

        /*  execute TSLint on given source file  */
        let content = await fs.readFile(filenames[i], "utf8")
        let configuration = TSLint.Configuration.findConfiguration(linterConfigFile, filenames[i]).results
        linter.lint(filenames[i], content, configuration)
        let result = linter.getResult()

        /*  report linting results  */
        if (result.errorCount > 0 || result.warningCount > 0) {
            passed = false
            result.failures.forEach((failure) => {
                let filename = path.relative(process.cwd(), failure.fileName)
                report.sources[filename] = failure.rawLines
                let [ ruleProc, ruleId ] = [ "tslint", failure.ruleName ]
                report.findings.push({
                    ctx:      "TS",
                    filename: filename,
                    line:     failure.startPosition.lineAndCharacter.line + 1,
                    column:   failure.startPosition.lineAndCharacter.character + 1,
                    message:  failure.failure,
                    ruleProc: ruleProc,
                    ruleId:   ruleId
                })
            })
        }
    }
    if (typeof opts.progress === "function")
        opts.progress(1.0, "")
    return passed
}

