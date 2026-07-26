import { NativeConnection, Runtime, Worker } from '@temporalio/worker'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import * as activities from '../order-workflow/activities'
import {
  orderTaskQueue,
  temporalAddress,
  temporalNamespace,
} from '../shared/temporal'

const connection = await NativeConnection.connect({
  address: temporalAddress,
})

const worker = await Worker.create({
  connection,
  namespace: temporalNamespace,
  taskQueue: orderTaskQueue,
  workflowsPath: path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '../order-workflow/workflows.ts',
  ),
  activities,
})

Runtime.instance().logger.info(
  `worker listening on task queue "${orderTaskQueue}"`,
  { taskQueue: orderTaskQueue, address: temporalAddress },
)

await worker.run()
