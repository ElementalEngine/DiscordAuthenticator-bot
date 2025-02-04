import { Router } from 'express'

import { AuthController } from '../controllers'

const router = Router()

const Routes = () => {
  //  @ts-ignore
  router.get('/', AuthController.authenticate, AuthController.registerUser)
  return router
}

export default Routes
