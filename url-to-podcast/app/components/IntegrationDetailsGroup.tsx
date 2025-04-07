import React from "react";
import IntegrationDetails from "./IntegrationDetails";

interface IntegrationDetailsGroupProps {
  items: string[];
}

const IntegrationDetailsGroup: React.FC<IntegrationDetailsGroupProps> = ({
  items = [],
}) => {
  return (
    <div className='flex flex-wrap justify-center gap-1 sm:gap-2 my-2 sm:my-4'>
      {items.map((item, index) => (
        <IntegrationDetails key={index} content={item} />
      ))}
    </div>
  );
};

export default IntegrationDetailsGroup;
