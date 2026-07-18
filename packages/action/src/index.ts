import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import * as core from '@actions/core'
import * as github from '@actions/github'
import { runCheck } from '@localeguard/cli/run'
import { buildComment, COMMENT_MARKER, type Report } from './summary.js'

async function main(): Promise<void> {
  const path = core.getInput('path', { required: true })
  const source = core.getInput('source') || undefined
  const format = core.getInput('format') || 'i18next'
  const sarifFile = core.getInput('sarif-file') || 'localeguard.sarif'
  const shouldComment = core.getBooleanInput('comment')
  const failOnError = core.getBooleanInput('fail-on-error')
  const token = core.getInput('github-token')

  // Two passes over the same catalogs (sarif for Code Scanning, json for the
  // comment). ponytail: double-parse, negligible cost; keeps the action a thin
  // wrapper over the CLI's public runCheck boundary.
  const sarif = runCheck({ target: path, source, format, reporter: 'sarif', fileConfig: {} })
  mkdirSync(dirname(sarifFile) || '.', { recursive: true })
  writeFileSync(sarifFile, sarif.output, 'utf8')
  core.setOutput('sarif-file', sarifFile)

  const json = runCheck({ target: path, source, format, reporter: 'json', fileConfig: {} })
  const report = JSON.parse(json.output) as Report
  core.setOutput('error-count', report.summary.error)
  core.setOutput('warning-count', report.summary.warning)

  const body = buildComment(report)
  // Job summary is a nice-to-have; only present on GitHub-hosted runs.
  if (process.env.GITHUB_STEP_SUMMARY) await core.summary.addRaw(body).write()

  if (shouldComment && token) {
    await upsertComment(token, body)
  }

  if (failOnError && report.summary.error > 0) {
    core.setFailed(`LocaleGuard found ${report.summary.error} error-severity issue(s).`)
  }
}

// Update our previous comment if one exists, else create it — one comment per PR.
async function upsertComment(token: string, body: string): Promise<void> {
  const pr = github.context.payload.pull_request
  if (!pr) return // not a pull_request event; SARIF + job summary still stand.

  const octokit = github.getOctokit(token)
  const { owner, repo } = github.context.repo
  const issue_number = pr.number

  const { data: comments } = await octokit.rest.issues.listComments({ owner, repo, issue_number })
  const existing = comments.find((c) => c.body?.includes(COMMENT_MARKER))

  if (existing) {
    await octokit.rest.issues.updateComment({ owner, repo, comment_id: existing.id, body })
  } else {
    await octokit.rest.issues.createComment({ owner, repo, issue_number, body })
  }
}

main().catch((err) => {
  // Config errors (bad format, missing source, unreadable path) and API failures
  // land here — fail the action with the message.
  core.setFailed(err instanceof Error ? err.message : String(err))
})
