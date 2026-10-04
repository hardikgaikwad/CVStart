import React from 'react';
import { User, Briefcase, Mail, Phone, MapPin, Globe, Code, Link2 } from 'lucide-react';
import { PersonalInfo } from '../types/resume';

interface PersonalInfoFormProps {
  data: PersonalInfo;
  onChange: (updated: PersonalInfo) => void;
}

export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({ data, onChange }) => {
  const updateField = (field: keyof PersonalInfo, value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-[#DEDEDE] pb-3 mb-4">
        <h3 className="text-sm font-semibold text-[#222222] flex items-center gap-2">
          <User className="w-4 h-4 text-[#222222]" />
          Personal & Contact Details
        </h3>
        <p className="text-xs text-[#666666] mt-0.5">
          These details populate the header contact line of your resume with clickable hyperlinks.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-medium text-[#666666] mb-1">
            Full Name *
          </label>
          <div className="relative">
            <User className="w-3.5 h-3.5 text-[#888888] absolute left-2.5 top-2" />
            <input
              type="text"
              value={data.full_name || ''}
              onChange={(e) => updateField('full_name', e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="w-full bg-white border border-[#DEDEDE] pl-8 pr-3 py-1.5 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
            />
          </div>
        </div>

        {/* Target Title */}
        <div>
          <label className="block text-xs font-medium text-[#666666] mb-1">
            Professional Title / Target Role
          </label>
          <div className="relative">
            <Briefcase className="w-3.5 h-3.5 text-[#888888] absolute left-2.5 top-2" />
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="e.g. Senior Software Architect"
              className="w-full bg-white border border-[#DEDEDE] pl-8 pr-3 py-1.5 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-[#666666] mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-3.5 h-3.5 text-[#888888] absolute left-2.5 top-2" />
            <input
              type="email"
              value={data.email || ''}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="alex@example.com"
              className="w-full bg-white border border-[#DEDEDE] pl-8 pr-3 py-1.5 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-medium text-[#666666] mb-1">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="w-3.5 h-3.5 text-[#888888] absolute left-2.5 top-2" />
            <input
              type="text"
              value={data.phone || ''}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="+1 (555) 019-2834"
              className="w-full bg-white border border-[#DEDEDE] pl-8 pr-3 py-1.5 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-medium text-[#666666] mb-1">
            Location
          </label>
          <div className="relative">
            <MapPin className="w-3.5 h-3.5 text-[#888888] absolute left-2.5 top-2" />
            <input
              type="text"
              value={data.location || ''}
              onChange={(e) => updateField('location', e.target.value)}
              placeholder="San Francisco, CA"
              className="w-full bg-white border border-[#DEDEDE] pl-8 pr-3 py-1.5 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
            />
          </div>
        </div>

        {/* Website */}
        <div>
          <label className="block text-xs font-medium text-[#666666] mb-1">
            Portfolio Website
          </label>
          <div className="relative">
            <Globe className="w-3.5 h-3.5 text-[#888888] absolute left-2.5 top-2" />
            <input
              type="text"
              value={data.website || ''}
              onChange={(e) => updateField('website', e.target.value)}
              placeholder="https://alexmorgan.dev"
              className="w-full bg-white border border-[#DEDEDE] pl-8 pr-3 py-1.5 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
            />
          </div>
        </div>

        {/* GitHub */}
        <div>
          <label className="block text-xs font-medium text-[#666666] mb-1">
            GitHub Profile
          </label>
          <div className="relative">
            <Code className="w-3.5 h-3.5 text-[#888888] absolute left-2.5 top-2" />
            <input
              type="text"
              value={data.github || ''}
              onChange={(e) => updateField('github', e.target.value)}
              placeholder="https://github.com/alexmorgan"
              className="w-full bg-white border border-[#DEDEDE] pl-8 pr-3 py-1.5 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
            />
          </div>
        </div>

        {/* LinkedIn */}
        <div>
          <label className="block text-xs font-medium text-[#666666] mb-1">
            LinkedIn Profile
          </label>
          <div className="relative">
            <Link2 className="w-3.5 h-3.5 text-[#888888] absolute left-2.5 top-2" />
            <input
              type="text"
              value={data.linkedin || ''}
              onChange={(e) => updateField('linkedin', e.target.value)}
              placeholder="https://linkedin.com/in/alexmorgan"
              className="w-full bg-white border border-[#DEDEDE] pl-8 pr-3 py-1.5 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
