import {
  updateUserTypeAttribute,
  UserType,
} from "@/app/utils/userAttributeUtils";

export function useAttributeUpdate(
  setAttributes: Function,
  setCurrentlyEditing: (key: string | null) => void,
  setLoading: (loading: boolean) => void
) {
  const submitAttributeUpdate = async (
    e: { preventDefault: () => void },
    attributeKey: keyof UserType,
    value: any,
    onCancel?: () => void
  ): Promise<string | void> => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await updateUserTypeAttribute(attributeKey, value);

      if (response === "200") {
        // Update the UI state
        await setAttributes({
          [attributeKey]: value,
        });

        // Exit edit mode
        setCurrentlyEditing(null);

        // Call optional cancel callback for additional cleanup
        if (onCancel) {
          onCancel();
        }
      } else {
        return response;
      }
    } catch (error) {
      return error instanceof Error ? error.message : "Update failed";
    }
    setLoading(false);
  };
  return { submitAttributeUpdate };
}
