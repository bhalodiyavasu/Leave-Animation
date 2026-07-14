export const useGetStateMutation = () => {
  const trigger = (code: string) => {
    return {
      unwrap: () => Promise.resolve([] as any[]),
    };
  };
  return [trigger, {} as any] as const;
};

export const useGetCityMutation = () => {
  const trigger = (id: string | number) => {
    return {
      unwrap: () => Promise.resolve([] as any[]),
    };
  };
  return [trigger, {} as any] as const;
};
