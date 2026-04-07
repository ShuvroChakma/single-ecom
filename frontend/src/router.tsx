import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import * as TanstackQuery from './integrations/tanstack-query/root-provider'

// Import the generated route tree
import { routeTree } from './routeTree.gen'
import { AuthProvider } from './contexts/AuthContext'
import { LoginModalProvider } from './contexts/LoginModalContext'
import LoginModal from './components/shared/Auth/LoginModal'

// Create a new router instance
export const getRouter = () => {
  const rqContext = TanstackQuery.getContext()

  const router = createRouter({
    routeTree,
    context: { ...rqContext },
    defaultPreload: 'intent',
    scrollRestoration: true,
    Wrap: (props: { children: React.ReactNode }) => {
      return (
        <TanstackQuery.Provider {...rqContext}>
          <AuthProvider>
            <LoginModalProvider>
              {props.children}
              <LoginModal />
            </LoginModalProvider>
          </AuthProvider>
        </TanstackQuery.Provider>
      )
    },
  })

  setupRouterSsrQueryIntegration({ router, queryClient: rqContext.queryClient })

  return router
}
