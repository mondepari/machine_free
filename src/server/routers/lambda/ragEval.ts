/*
Entire content of ragEval.ts commented out due to missing models ('@/database/models/ragEval/*').
This effectively disables the RAG evaluation API endpoints.

Original content included imports for:
- TRPCError
- dayjs
- JSONL
- pMap
- z
- constants
- various database models (AsyncTaskModel, ChunkModel, EmbeddingModel, FileModel, RagEvalDatasetModel, RagEvalDatasetRecordModel, RagEvalEvaluationModel, RagEvalEvaluationRecordModel)
- getServerDBInstance
- router procedures
- S3 module
- async client
- types/eval

It defined a `ragEvalProcedure` middleware and the `ragEvalRouter` with mutations/queries for:
- Dataset CRUD
- Dataset Record CRUD
- Importing Dataset Records
- Evaluation Task operations
- Evaluation Record CRUD
*/

// Placeholder export to avoid breaking imports if necessary.
// Remove this file's import from `src/server/routers/lambda/index.ts` if this router is no longer needed.
import { router } from '@/libs/trpc';

export const ragEvalRouter = router({});
