# frozen_string_literal: true

module Middleware # rubocop:disable Style/ClassAndModuleChildren
  class IndicaFacilPlatformHeader
    def initialize(app)
      @app = app
    end

    def call(env)
      status, headers, response = @app.call(env)
      headers['X-Platform'] = 'indicafacil.app'
      [status, headers, response]
    end
  end
end
