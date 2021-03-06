#-- encoding: UTF-8
#-- copyright
# OpenProject is a project management system.
#
# Copyright (C) 2012-2013 the OpenProject Team
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License version 3.
#
# See doc/COPYRIGHT.rdoc for more details.
#++

class Wiki < ActiveRecord::Base
  include Redmine::SafeAttributes
  belongs_to :project
  has_many :pages, :class_name => 'WikiPage', :dependent => :destroy, :order => 'title'
  has_many :wiki_menu_items, :class_name => 'WikiMenuItem', :dependent => :delete_all, :order => 'name'
  has_many :redirects, :class_name => 'WikiRedirect', :dependent => :delete_all


  acts_as_watchable

  accepts_nested_attributes_for :wiki_menu_items,
    :allow_destroy => true,
    :reject_if => proc { |attr| attr['name'].blank? && attr['title'].blank? }

  safe_attributes 'wiki_menu_items_attributes'

  attr_protected :project_id

  validates_presence_of :start_page
  validates_format_of :start_page, :with => /^[^,\.\/\?\;\|\:]*$/

  safe_attributes 'start_page'

  def visible?(user=User.current)
    !user.nil? && user.allowed_to?(:view_wiki_pages, project)
  end

  # Returns the wiki page that acts as the sidebar content
  # or nil if no such page exists
  def sidebar
    @sidebar ||= find_page('Sidebar', :with_redirect => false)
  end

  # find the page with the given title
  # if page doesn't exist, return a new page
  def find_or_new_page(title)
    title = start_page if title.blank?
    find_page(title) || WikiPage.new(:wiki => self, :title => Wiki.titleize(title))
  end

  # find the page with the given title
  def find_page(title, options = {})
    title = start_page if title.blank?
    title = Wiki.titleize(title)
    page = pages.first(:conditions => ["LOWER(title) = LOWER(?)", title])
    if !page && !(options[:with_redirect] == false)
      # search for a redirect
      redirect = redirects.first(:conditions => ["LOWER(title) = LOWER(?)", title])
      page = find_page(redirect.redirects_to, :with_redirect => false) if redirect
    end
    page
  end

  # Finds a page by title
  # The given string can be of one of the forms: "title" or "project:title"
  # Examples:
  #   Wiki.find_page("bar", project => foo)
  #   Wiki.find_page("foo:bar")
  def self.find_page(title, options = {})
    project = options[:project]
    if title.to_s =~ %r{^([^\:]+)\:(.*)$}
      project_identifier, title = $1, $2
      project = Project.find_by_identifier(project_identifier) || Project.find_by_name(project_identifier)
    end
    if project && project.wiki
      page = project.wiki.find_page(title)
      if page && page.content
        page
      end
    end
  end

  # turn a string into a valid page title
  def self.titleize(title)
    # replace spaces with _ and remove unwanted caracters
    title = title.gsub(/\s+/, '_').delete(',./?;|:') if title
    # upcase the first letter
    title = (title.slice(0..0).upcase + (title.slice(1..-1) || '')) if title
    title
  end
end
