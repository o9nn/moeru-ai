import type { FileHandle } from 'node:fs/promises'

import type { Plugin, ResolvedConfig } from 'vite'

import { copyFile, mkdir, open, rename, stat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

import { createLogger } from 'vite'

export interface DownloadAsset {
  url: string
  filename: string
  destination: string
}

export interface DownloadOptions {
  retries?: number
  retryDelayMs?: number
  timeoutMs?: number
}

const DEFAULT_OPTIONS: Required<DownloadOptions> = {
  retries: 4,
  retryDelayMs: 500,
  timeoutMs: 300_000,
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath)
    return true
  }
  catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return false
    }
    throw error
  }
}

function delay(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function writeResponseBody(response: Response, file: FileHandle): Promise<number> {
  if (!response.body) {
    throw new Error('Download response did not contain a body')
  }

  let bytesWritten = 0
  for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
    let chunkOffset = 0
    while (chunkOffset < chunk.byteLength) {
      const result = await file.write(chunk, chunkOffset, chunk.byteLength - chunkOffset)
      chunkOffset += result.bytesWritten
    }
    bytesWritten += chunk.byteLength
  }
  return bytesWritten
}

function completedRangeSize(response: Response): number | undefined {
  const match = response.headers.get('content-range')?.match(/^bytes \*\/(\d+)$/)
  return match ? Number(match[1]) : undefined
}

function responseRangeStart(response: Response): number | undefined {
  const match = response.headers.get('content-range')?.match(/^bytes (\d+)-\d+\/\d+$/)
  return match ? Number(match[1]) : undefined
}

/**
 * Download a file while preserving partial bytes between attempts and builds.
 */
export async function downloadFileWithRetry(
  url: string,
  partialFile: string,
  filename: string,
  options: DownloadOptions = {},
  onWarning: (message: string) => void = () => undefined,
): Promise<void> {
  const resolvedOptions: Required<DownloadOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
  }
  let lastError: unknown

  await mkdir(dirname(partialFile), { recursive: true })

  for (let attempt = 1; attempt <= resolvedOptions.retries + 1; attempt++) {
    let offset = await stat(partialFile).then(result => result.size).catch(() => 0)

    try {
      const response = await fetch(url, {
        headers: offset > 0 ? { Range: `bytes=${offset}-` } : undefined,
        signal: AbortSignal.timeout(resolvedOptions.timeoutMs),
      })

      if (response.status === 416 && completedRangeSize(response) === offset) {
        return
      }
      if (!response.ok) {
        throw new Error(`Download failed with HTTP ${response.status} ${response.statusText}`)
      }

      const isResume = offset > 0 && response.status === 206
      if (isResume && responseRangeStart(response) !== offset) {
        throw new Error(`Download server returned an invalid byte range for ${filename}`)
      }
      if (!isResume) {
        offset = 0
      }

      const file = await open(partialFile, isResume ? 'a' : 'w')
      let bytesWritten: number
      try {
        bytesWritten = await writeResponseBody(response, file)
      }
      finally {
        await file.close()
      }

      const expectedBytes = Number(response.headers.get('content-length'))
      if (!response.headers.has('content-encoding') && Number.isFinite(expectedBytes) && bytesWritten !== expectedBytes) {
        throw new Error(`Incomplete download for ${filename}: expected ${expectedBytes} bytes, received ${bytesWritten}`)
      }

      const finalSize = (await stat(partialFile)).size
      if (finalSize !== offset + bytesWritten) {
        throw new Error(`Unexpected file size after downloading ${filename}`)
      }
      return
    }
    catch (error) {
      lastError = error
      if (attempt > resolvedOptions.retries) {
        break
      }

      const message = error instanceof Error ? error.message : String(error)
      onWarning(`Download attempt ${attempt} for ${filename} failed: ${message}. Retrying...`)
      await delay(resolvedOptions.retryDelayMs * 2 ** (attempt - 1))
    }
  }

  throw lastError
}

async function materializeAsset(
  config: ResolvedConfig,
  asset: DownloadAsset,
  options: Required<DownloadOptions>,
): Promise<void> {
  const logger = createLogger()
  const cacheDirectory = resolve(config.root, '.cache', asset.destination)
  const publicDirectory = resolve(config.root, config.publicDir || 'public', asset.destination)
  const cachedFile = join(cacheDirectory, asset.filename)
  const partialFile = `${cachedFile}.partial`
  const publicFile = join(publicDirectory, asset.filename)

  if (!await exists(cachedFile) && await exists(publicFile)) {
    await mkdir(cacheDirectory, { recursive: true })
    await copyFile(publicFile, cachedFile)
    logger.info(`${asset.filename} seeded into the download cache.`)
  }

  if (!await exists(cachedFile)) {
    logger.info(`Downloading ${asset.filename}...`)
    await downloadFileWithRetry(
      asset.url,
      partialFile,
      asset.filename,
      options,
      message => logger.warn(message),
    )
    await rename(partialFile, cachedFile)
    logger.info(`${asset.filename} downloaded.`)
  }

  if (!await exists(publicFile)) {
    await mkdir(publicDirectory, { recursive: true })
    await copyFile(cachedFile, publicFile)
    logger.info(`${asset.filename} copied to ${publicDirectory}.`)
  }
}

/**
 * Download build assets sequentially with resumable exponential-backoff retries.
 *
 * Sequential downloads avoid overwhelming a single asset host. Files are
 * written to resumable partials in the Vite cache, then atomically renamed and
 * copied into publicDir. Existing public files can seed a clean cache.
 */
export function DownloadAssetsWithRetry(
  assets: DownloadAsset[],
  options: DownloadOptions = {},
): Plugin {
  const resolvedOptions: Required<DownloadOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  return {
    name: 'download-assets-with-retry',
    async configResolved(config) {
      for (const asset of assets) {
        await materializeAsset(config, asset, resolvedOptions)
      }
    },
  }
}
