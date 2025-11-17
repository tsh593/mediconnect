// cmsNppesService.js
export class CMSNppesService {
    async searchDoctorsByLocation(location, specialty) {
        // National Provider Identifier database - FREE government data
        const response = await fetch(
            `https://npiregistry.cms.hhs.gov/api/?version=2.1&city=${location}&taxonomy_description=${specialty}&limit=10`
        );

        const data = await response.json();

        return data.results.map(provider => ({
            id: provider.number,
            name: `${provider.basic.first_name} ${provider.basic.last_name}`,
            specialty: provider.taxonomies[0]?.desc || 'General Practice',
            address: provider.addresses[0]?.address_1,
            city: provider.addresses[0]?.city,
            state: provider.addresses[0]?.state,
            phone: provider.addresses[0]?.telephone_number,
            credentials: provider.basic.credential
        }));
    }
}