/**
 * Auth module router.
 * Mounts sub-modules with their prefix; no sub-module = define routes here.
 */
import { Router } from 'express'
import { emailAuthRouter } from './email/routes'

const router = Router()

// Sub-module: email auth → prefix /email → /api/v1/auth/email/*
router.use('/email', emailAuthRouter)

export default router
