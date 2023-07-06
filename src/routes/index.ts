import { Router } from 'express'

import { AuthController } from '../controllers'

const router = Router()

const Routes = () => {
  router.get(
    '/',
    AuthController.Validate,
    AuthController.FetchDiscord,
    AuthController.FetchDiscordConnections,
    AuthController.ValidateSteam,
    AuthController.RegisterUser
  )
  return router
}

export default Routes
