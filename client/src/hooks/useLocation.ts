"use client";

import { useEffect, useRef, useState } from "react";
import { UseFormReturn, FieldValues } from "react-hook-form";
import {
  useGetStateMutation,
  useGetCityMutation,
} from "@/store/action/location/location";

export function useLocation({
  data,
  methods,
  isEditMode = false,
  parent,
}: {
  data?: {
    countryCode?: string;
    stateId?: string | number;
    cityId?: string | number;
  };
  methods: UseFormReturn<FieldValues>;
  isEditMode?: boolean;
  parent?: string;
}) {
  const [stateList, setStateList] = useState<Record<string, unknown>[]>([]);
  const [cityList, setCityList] = useState<Record<string, unknown>[]>([]);

  const [getStateMutation] = useGetStateMutation();
  const [getCityMutation] = useGetCityMutation();

  const watchedCountry = methods.watch(
    parent ? `${parent}.countryCode` : "countryCode",
  );
  const watchedState = methods.watch(parent ? `${parent}.stateId` : "stateId");

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isEditMode && data?.countryCode) {
      methods.setValue(
        parent ? `${parent}.countryCode` : "countryCode",
        data.countryCode,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.countryCode, isEditMode]);

  useEffect(() => {
    const code = watchedCountry;

    if (code) {
      getStateMutation(code)
        .unwrap()
        .then((response) => {
          setStateList(response || []);
        })
        .catch((error) => {
          console.error("Error fetching states:", error);
          setStateList([]);
        });

      const isPrefilling = methods.getValues && methods.getValues()._prefilling;
      if (
        !isFirstRender.current &&
        (!isEditMode || code !== data?.countryCode) &&
        !isPrefilling
      ) {
        methods.setValue(parent ? `${parent}.stateId` : "stateId", "");
        methods.setValue(parent ? `${parent}.cityId` : "cityId", "");
        setCityList([]);
      }
    } else {
      setStateList([]);
      setCityList([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedCountry, getStateMutation, isEditMode, data?.countryCode]);

  useEffect(() => {
    if (isEditMode && stateList?.length && data?.stateId) {
      const stateExists = stateList.some(
        (s) => Number(s.id) === Number(data.stateId),
      );
      if (stateExists) {
        methods.setValue(
          parent ? `${parent}.stateId` : "stateId",
          String(data.stateId),
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateList, isEditMode, data?.stateId]);

  useEffect(() => {
    const id = watchedState;
    if (id) {
      getCityMutation(id)
        .unwrap()
        .then((response) => {
          setCityList(response || []);
        })
        .catch((error) => {
          console.error("Error fetching cities:", error);
          setCityList([]);
        });

      const isPrefilling = methods.getValues && methods.getValues()._prefilling;
      if (
        !isFirstRender.current &&
        (!isEditMode || id !== data?.stateId) &&
        !isPrefilling
      ) {
        methods.setValue(parent ? `${parent}.cityId` : "cityId", "");
      }
    } else {
      setCityList([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedState, getCityMutation, isEditMode, data?.stateId]);

  useEffect(() => {
    if (
      isEditMode &&
      Array.isArray(cityList) &&
      cityList.length > 0 &&
      data?.cityId
    ) {
      const cityExists = cityList.some(
        (c) => Number(c.id) === Number(data.cityId),
      );
      if (cityExists) {
        methods.setValue(
          parent ? `${parent}.cityId` : "cityId",
          String(data.cityId),
        );
      } else {
        methods.setValue(parent ? `${parent}.cityId` : "cityId", "");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityList, data?.cityId, isEditMode]);

  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  return {
    stateList,
    cityList,
  };
}
