import { Buffer } from 'node:buffer'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { downloadFileWithRetry } from './download-with-retry'

const cleanupPaths: string[] = []

afterEach(async () => {
  await Promise.all(cleanupPaths.splice(0).map(path => rm(path, { force: true, recursive: true })))
})

describe('downloadFileWithRetry', () => {
  it('resumes an interrupted transfer from the partial byte count', async () => {
    const payload = Buffer.alloc(1024 * 1024, 'a')
    const splitAt = 128 * 1024
    const receivedRanges: string[] = []
    let requestCount = 0

    const server = createServer((request, response) => {
      requestCount++
      const range = request.headers.range
      if (range) {
        receivedRanges.push(range)
        const start = Number(range.match(/^bytes=(\d+)-$/)?.[1])
        response.writeHead(206, {
          'accept-ranges': 'bytes',
          'content-length': payload.length - start,
          'content-range': `bytes ${start}-${payload.length - 1}/${payload.length}`,
        })
        response.end(payload.subarray(start))
        return
      }

      response.writeHead(200, {
        'accept-ranges': 'bytes',
        'content-length': payload.length,
      })
      response.write(payload.subarray(0, splitAt), () => response.socket?.destroy())
    })

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve)
    })

    try {
      const address = server.address()
      if (!address || typeof address === 'string') {
        throw new TypeError('Expected a TCP test server address')
      }

      const directory = await mkdtemp(join(tmpdir(), 'airi-download-test-'))
      cleanupPaths.push(directory)
      const target = join(directory, 'asset.partial')
      const warnings: string[] = []

      await downloadFileWithRetry(
        `http://127.0.0.1:${address.port}/asset`,
        target,
        'asset.bin',
        { retries: 2, retryDelayMs: 1, timeoutMs: 10_000 },
        warning => warnings.push(warning),
      )

      expect(await readFile(target)).toEqual(payload)
      expect(requestCount).toBe(2)
      expect(receivedRanges).toEqual([`bytes=${splitAt}-`])
      expect(warnings).toHaveLength(1)
    }
    finally {
      await new Promise<void>((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve())
      })
    }
  }, 20_000)
})
