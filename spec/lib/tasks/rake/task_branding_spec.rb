require 'rake'
require 'rails_helper'

# What an installation calls itself when nobody configures it. Worth pinning:
# these defaults sit in a file that gets merged from upstream, where the same
# keys carry the other project's name, and nothing about the merge would look
# wrong. The damage shows up in a customer's inbox, not on our screen.
RSpec.describe Rake::Task do
  describe 'branding:update' do
    subject(:task) { described_class['branding:update'] }

    let(:names) { %w[INSTALLATION_NAME BRAND_NAME BRAND_URL WIDGET_BRAND_URL DISPLAY_MANIFEST] }

    before do
      task.reenable
      names.each { |name| InstallationConfig.find_or_create_by!(name: name) { |config| config.value = 'placeholder' } }
    end

    def config_value(name)
      InstallationConfig.find_by!(name: name).value
    end

    it 'brands the installation as this product, not as the project it is built on' do
      with_modified_env INSTALLATION_NAME: nil, BRAND_NAME: nil, BRAND_URL: nil, WIDGET_BRAND_URL: nil do
        task.invoke
      end

      expect(config_value('INSTALLATION_NAME')).to eq('IndicaFácil.AI')
      expect(config_value('BRAND_NAME')).to eq('IndicaFácil.AI')
      expect(config_value('BRAND_URL')).to eq('https://indicafacil.app')
      expect(config_value('WIDGET_BRAND_URL')).to eq('https://indicafacil.app')
    end

    it 'lets an instance override the brand through the environment' do
      with_modified_env BRAND_NAME: 'Agência do Cliente', BRAND_URL: 'https://cliente.com.br' do
        task.invoke
      end

      expect(config_value('BRAND_NAME')).to eq('Agência do Cliente')
      expect(config_value('BRAND_URL')).to eq('https://cliente.com.br')
    end

    # `- BRAND_NAME=${BRAND_NAME}` in a compose file whose variable was never
    # set in the panel arrives as "", and ENV.fetch would hand that straight
    # through. An instance branded as nothing at all is worse than one branded
    # upstream, because nobody reads it as a misconfiguration.
    it 'treats an empty environment variable as unset' do
      with_modified_env BRAND_NAME: '', BRAND_URL: '' do
        task.invoke
      end

      expect(config_value('BRAND_NAME')).to eq('IndicaFácil.AI')
      expect(config_value('BRAND_URL')).to eq('https://indicafacil.app')
    end

    # The same emptiness on a boolean is not merely blank: "" is not "true", so
    # it reads as an explicit off. DISPLAY_MANIFEST off takes the new-version
    # banner down with it, which is a feature this fork added on purpose.
    it 'keeps the new-version banner on when its variable arrives empty' do
      with_modified_env DISPLAY_MANIFEST: '' do
        task.invoke
      end

      expect(config_value('DISPLAY_MANIFEST')).to be(true)
    end

    it 'still lets the banner be switched off deliberately' do
      with_modified_env DISPLAY_MANIFEST: 'false' do
        task.invoke
      end

      expect(config_value('DISPLAY_MANIFEST')).to be(false)
    end
  end
end
