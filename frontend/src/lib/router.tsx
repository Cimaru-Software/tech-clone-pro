import {
  Link as RouterLink,
  NavLink,
  useNavigate as useReactNavigate,
  useParams,
  useSearchParams,
  type LinkProps as RouterLinkProps,
} from "react-router-dom";

type SearchValue = string | number | boolean | null | undefined;

type CompatLinkProps = Omit<RouterLinkProps, "to"> & {
  to: string;
  params?: Record<string, string | number>;
  search?: Record<string, SearchValue>;
  activeOptions?: { exact?: boolean };
  activeProps?: { className?: string };
};

type NavigateTarget =
  | string
  | number
  | {
      to: string;
      params?: Record<string, string | number>;
      search?: Record<string, SearchValue>;
      replace?: boolean;
    };

function buildTo(to: string, params?: Record<string, string | number>, search?: Record<string, SearchValue>) {
  let path = to;

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      path = path.replace(`$${key}`, encodeURIComponent(String(value)));
      path = path.replace(`:${key}`, encodeURIComponent(String(value)));
    }
  }

  if (search) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(search)) {
      if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
    }
    const queryString = query.toString();
    if (queryString) path += `?${queryString}`;
  }

  return path;
}

export function Link({ to, params, search, activeOptions, activeProps, className, ...props }: CompatLinkProps) {
  const href = buildTo(to, params, search);

  if (activeProps) {
    return (
      <NavLink
        to={href}
        end={activeOptions?.exact}
        className={({ isActive }) => [className, isActive ? activeProps.className : ""].filter(Boolean).join(" ")}
        {...props}
      />
    );
  }

  return <RouterLink to={href} className={className} {...props} />;
}

export function useNavigate() {
  const navigate = useReactNavigate();

  return (target: NavigateTarget) => {
    if (typeof target === "number") {
      navigate(target);
      return;
    }

    if (typeof target === "string") {
      navigate(target);
      return;
    }

    navigate(buildTo(target.to, target.params, target.search), { replace: target.replace });
  };
}

export { useParams, useSearchParams };
