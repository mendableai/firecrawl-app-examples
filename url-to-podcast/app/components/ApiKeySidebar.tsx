import React from "react";
import ReusableSidebar from "./ReusableSidebar";
import ApiKeyForm from "./ApiKeyForm";
import { Settings } from "lucide-react";

interface ApiKeySidebarProps {
  onApiKeySet: (firecrawlKey: string) => void;
  apiKeysConfigured: boolean;
}

const ApiKeySidebar: React.FC<ApiKeySidebarProps> = ({
  onApiKeySet,
  apiKeysConfigured,
}) => {
  return (
    <ReusableSidebar
      title='API Settings'
      subtitle='Configure your API keys'
      buttonIcon={<Settings size={24} />}
      buttonLabel='Toggle API Settings'
      isConfigured={apiKeysConfigured}
      statusText={{
        configured: "API Keys ✓",
        notConfigured: "Configure API Keys",
      }}
      headerClassName='bg-gradient-to-r from-orange-500 to-orange-600'>
      <ApiKeyForm onApiKeySet={onApiKeySet} />
    </ReusableSidebar>
  );
};

export default ApiKeySidebar;
