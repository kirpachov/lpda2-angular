# Will update a .xlf file to remove all the translations that don't have any interpolations.
# This is useful if you want to check interpolations in the translations.
# 
# Usage from root:
# ruby scripts/translations-check-interpolations.rb locales/messages.en.xlf

# ruby 3.2.2 (2023-03-30 revision e51014f9c0) [x86_64-linux]

require 'nokogiri' #  (1.16.2, 1.15.5)
require "debug" # 1.9.2, 1.9.1, 1.7.1
require "rexml/document" # (3.2.6, 3.2.5)
# require "rexml/document"
# require "faraday" # 2.11.0
# require "oj" # 3.16.3, 3.16.5

# Step 1: Check if the files exist and load them.
INPUT_FILE_PATH = ARGV[0] || raise("Usage: #{$0} <input_file_path> [<output_file_path>]")
OUTPUT_FILE_PATH = ARGV[1] || "#{INPUT_FILE_PATH}.check_interpolations"

raise "The original file doesn't exist." unless File.exist?(INPUT_FILE_PATH)

FileUtils.touch(OUTPUT_FILE_PATH) unless File.exist?(OUTPUT_FILE_PATH)

input_file = Nokogiri::XML(File.open(INPUT_FILE_PATH))

trans_ids_with_translations = input_file.search("x").map{|el| el.ancestors("trans-unit").map{|j| j.attributes["id"].to_s } }.flatten.uniq

# puts "trans_ids_with_translations:\n#{trans_ids_with_translations.join(", ")}"

input_file.search("trans-unit").each do |trans_unit|
  next trans_unit.remove unless trans_ids_with_translations.include?(trans_unit.attributes["id"].to_s)

  source = trans_unit.search("source x")
  target = trans_unit.search("target x")

  equal = (source.length == target.length && source.each_with_index.all?{|source_x, index| source_x.to_s == target[index].to_s })

  next trans_unit.remove if equal

  puts trans_unit.attributes["id"].to_s
end

doc = REXML::Document.new(input_file.to_xml)
formatter = REXML::Formatters::Pretty.new
formatter.compact = true

formatter.write(doc, File.open(OUTPUT_FILE_PATH, "w"))

# debugger
