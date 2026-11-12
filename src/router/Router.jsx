import React, { createContext, useContext, useState, useEffect, useCallback, forwardRef } from 'react';

const RouterContext = createContext({
  path: '/',
  navKey: 0,
  navigate: () => {},
});

export const useRouter = () => useContext(RouterContext);

const currentPath = () => window.location.pathname || '/';

export const Router = ({ children }) => {
  const [path, setPath] = useState(currentPath);
  // navKey increments on every navigation (including back/forward) so the
  // shell can replay route progress and page-enter animations.
  const [navKey, setNavKey] = useState(0);

  useEffect(() => {
    const handlePopState = () => {
      setPath(currentPath());
      setNavKey(k => k + 1);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to, { replace = false } = {}) => {
    if (to === currentPath()) return;
    window.history[replace ? 'replaceState' : 'pushState']({}, '', to);
    setPath(to);
    setNavKey(k => k + 1);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <RouterContext.Provider value={{ path, navKey, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};

export const Link = forwardRef(function Link({ to, children, className = '', onClick, ...rest }, ref) {
  const { navigate, path } = useRouter();
  const isActive = path === to;

  return (
    <a
      ref={ref}
      href={to}
      aria-current={isActive ? 'page' : undefined}
      {...rest}
      onClick={(e) => {
        // let modified clicks open new tabs as the browser intends
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        navigate(to);
        if (onClick) onClick(e);
      }}
      className={`${className} ${isActive ? 'active-link' : ''}`.trim()}
    >
      {typeof children === 'function' ? children({ isActive }) : children}
    </a>
  );
});

export const Route = ({ path: routePath, component: Component }) => {
  const { path } = useRouter();
  if (path !== routePath) return null;
  return <Component />;
};
