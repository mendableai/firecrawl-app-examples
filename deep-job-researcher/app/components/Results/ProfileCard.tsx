import React from "react";
import { ResumeData } from "../../services/firecrawl";

interface ProfileCardProps {
  profile: ResumeData;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
  if (!profile) return null;

  return (
    <div className='bg-white rounded-xl shadow-lg overflow-hidden mb-8 border border-orange-100'>
      <div className='bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 text-white'>
        <h2 className='text-2xl font-bold tracking-tight'>
          {profile.name || "Unknown Name"}
        </h2>
        <p className='text-orange-50 mt-1 font-medium'>
          {profile.title || "Professional"}
        </p>
      </div>

      <div className='p-6 space-y-6'>
        {profile.summary && (
          <div className='border-b border-orange-100 pb-4'>
            <h3 className='text-lg font-semibold text-gray-800 mb-2 flex items-center'>
              <span className='w-1 h-5 bg-orange-500 rounded mr-2'></span>
              Summary
            </h3>
            <p className='text-gray-700 leading-relaxed'>{profile.summary}</p>
          </div>
        )}

        {profile.skills && profile.skills.length > 0 && (
          <div className='border-b border-orange-100 pb-4'>
            <h3 className='text-lg font-semibold text-gray-800 mb-3 flex items-center'>
              <span className='w-1 h-5 bg-orange-500 rounded mr-2'></span>
              Skills
            </h3>
            <div className='flex flex-wrap gap-2'>
              {profile.skills.map((skill, index) => (
                <span
                  key={index}
                  className='px-3 py-1.5 bg-orange-50 text-orange-800 border border-orange-200 rounded-md text-sm font-medium'>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.education && profile.education.length > 0 && (
          <div className='border-b border-orange-100 pb-4'>
            <h3 className='text-lg font-semibold text-gray-800 mb-3 flex items-center'>
              <span className='w-1 h-5 bg-orange-500 rounded mr-2'></span>
              Education
            </h3>
            <div className='space-y-3'>
              {profile.education.map((edu, index) => (
                <div
                  key={index}
                  className='border-l-3 border-orange-300 pl-4 py-1 hover:border-orange-500 transition-colors'>
                  <div className='flex justify-between items-center'>
                    <p className='font-medium text-gray-800 text-base'>
                      {edu.degree}
                    </p>
                    <p className='text-sm text-gray-500 ml-4'>{edu.date}</p>
                  </div>
                  <p className='text-gray-600 mt-1'>{edu.institution}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {profile.contact && (
          <div>
            <h3 className='text-lg font-semibold text-gray-800 mb-3 flex items-center'>
              <span className='w-1 h-5 bg-orange-500 rounded mr-2'></span>
              Contact
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              {profile.contact.email && (
                <div className='text-sm flex items-center'>
                  <span className='text-gray-500 mr-2 min-w-20'>Email:</span>
                  <span className='text-gray-700 font-medium'>
                    {profile.contact.email}
                  </span>
                </div>
              )}
              {profile.contact.phone && (
                <div className='text-sm flex items-center'>
                  <span className='text-gray-500 mr-2 min-w-20'>Phone:</span>
                  <span className='text-gray-700 font-medium'>
                    {profile.contact.phone}
                  </span>
                </div>
              )}
              {profile.contact.linkedin && (
                <div className='text-sm flex items-center'>
                  <span className='text-gray-500 mr-2 min-w-20'>LinkedIn:</span>
                  <span className='text-gray-700 font-medium'>
                    {profile.contact.linkedin}
                  </span>
                </div>
              )}
              {profile.contact.github && (
                <div className='text-sm flex items-center'>
                  <span className='text-gray-500 mr-2 min-w-20'>GitHub:</span>
                  <span className='text-gray-700 font-medium'>
                    {profile.contact.github}
                  </span>
                </div>
              )}
              {profile.contact.website && (
                <div className='text-sm flex items-center'>
                  <span className='text-gray-500 mr-2 min-w-20'>Website:</span>
                  <span className='text-gray-700 font-medium'>
                    {profile.contact.website}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;
